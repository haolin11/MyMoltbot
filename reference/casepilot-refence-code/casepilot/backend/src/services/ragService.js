import { VectorService } from './vectorService.js';
import { CaseModel, CaseChunkModel } from '../models/index.js';
import { vectorConfig } from '../config/vector.js';
import logger from '../utils/logger.js';

/**
 * RAG检索服务
 * 整合向量检索和上下文构建
 */
export class RAGService {
  /**
   * RAG检索：根据用户需求检索相关案例内容
   */
  static async retrieve(userInput, options = {}) {
    const {
      topK = vectorConfig.defaultTopK,
      inputMethod = 'text', // 'text' or 'form'
      minScore = vectorConfig.defaultMinScore
    } = options;

    try {
      // 1. 构建查询文本
      const queryText = this.buildQueryText(userInput, inputMethod);
      logger.info(`RAG检索查询: ${queryText.substring(0, 100)}...`);

      // 2. 向量检索相似文本块
      const similarChunks = await VectorService.searchSimilar(queryText, {
        topK: topK * 2, // 多检索一些，后续去重和筛选
        minScore
      });

      logger.info(`向量检索返回 ${similarChunks.length} 个文本块，相似度分数范围: ${similarChunks.length > 0 ? `${similarChunks[similarChunks.length - 1].score.toFixed(3)} - ${similarChunks[0].score.toFixed(3)}` : '无'}`);

      if (similarChunks.length === 0) {
        logger.warn('未检索到相关案例内容，可能原因：1) 向量数据库为空 2) 相似度阈值过高 3) 查询文本与案例内容差异较大');
        return {
          contexts: [],
          relatedCases: []
        };
      }

      // 3. 获取完整的案例信息
      const caseIds = [...new Set(similarChunks.map(c => c.case_id).filter(Boolean))];
      const cases = await Promise.all(
        caseIds.map(id => CaseModel.findById(id))
      );
      const caseMap = new Map(cases.filter(Boolean).map(c => [c.id, c]));

      // 4. 构建RAG上下文
      const contexts = [];
      const seenCaseIds = new Set();

      for (const chunk of similarChunks) {
        const caseInfo = caseMap.get(chunk.case_id);
        if (!caseInfo) continue;

        // 去重：每个案例最多取2个chunk
        const caseChunkCount = contexts.filter(c => c.case_id === chunk.case_id).length;
        if (caseChunkCount >= 2) continue;

        contexts.push({
          chunk_id: chunk.chunk_id,
          case_id: chunk.case_id,
          case_title: caseInfo.title,
          case_industry: caseInfo.industry,
          case_scenario: caseInfo.scenario,
          case_metrics: caseInfo.metrics,
          case_acceptance_standards: caseInfo.acceptance_standards,
          content: chunk.content,
          score: chunk.score,
          metadata: chunk.metadata
        });

        seenCaseIds.add(chunk.case_id);

        // 达到目标数量就停止
        if (contexts.length >= topK) {
          break;
        }
      }

      // 5. 按相似度排序
      contexts.sort((a, b) => b.score - a.score);

      // 6. 获取相关案例信息
      const relatedCases = Array.from(seenCaseIds).map(id => {
        const caseInfo = caseMap.get(id);
        return {
          id: caseInfo.id,
          title: caseInfo.title,
          industry: caseInfo.industry,
          scenario: caseInfo.scenario,
          technology: caseInfo.technology,
          description: caseInfo.description
        };
      });

      logger.info(`RAG检索完成: 找到 ${contexts.length} 个相关文本块，涉及 ${relatedCases.length} 个案例`);
      if (relatedCases.length > 0) {
        logger.info(`相关案例列表: ${relatedCases.map(c => `[${c.id}]${c.title}`).join(', ')}`);
      }

      return {
        contexts,
        relatedCases
      };
    } catch (error) {
      logger.error('RAG检索失败:', error);
      throw new Error(`RAG检索失败: ${error.message}`);
    }
  }

  /**
   * 构建查询文本
   * 根据输入方式（文本描述或结构化表单）构建查询文本
   */
  static buildQueryText(userInput, inputMethod) {
    if (inputMethod === 'text') {
      // 文本描述方式：直接使用标题和描述
      return `${userInput.title || ''}\n${userInput.description || ''}`.trim();
    } else {
      // 结构化表单方式：组合关键信息
      const parts = [];
      
      if (userInput.title) {
        parts.push(`项目标题: ${userInput.title}`);
      }
      if (userInput.industry) {
        parts.push(`所属行业: ${userInput.industry}`);
      }
      if (userInput.technology) {
        parts.push(`技术方向: ${userInput.technology}`);
      }
      if (userInput.objectives) {
        parts.push(`项目目标: ${userInput.objectives}`);
      }
      if (userInput.requirements) {
        parts.push(`技术要求: ${userInput.requirements}`);
      }

      return parts.join('\n');
    }
  }

  /**
   * 增强检索：结合关键词和语义检索
   */
  static async enhancedRetrieve(userInput, options = {}) {
    const {
      topK = vectorConfig.defaultTopK,
      inputMethod = 'text',
      useKeywordSearch = true
    } = options;

    // 语义检索（向量检索）
    const semanticResult = await this.retrieve(userInput, {
      topK: Math.ceil(topK * 0.7), // 70%来自语义检索
      inputMethod,
      minScore: vectorConfig.relaxedMinScore // 使用宽松阈值以提高匹配率
    });

    // 关键词检索（如果启用）
    let keywordResult = { contexts: [], relatedCases: [] };
    if (useKeywordSearch && inputMethod === 'form') {
      // 从结构化表单中提取关键词进行数据库全文检索
      const keywords = [];
      if (userInput.industry) keywords.push(userInput.industry);
      if (userInput.technology) keywords.push(userInput.technology);
      if (userInput.scenario) keywords.push(userInput.scenario);

      if (keywords.length > 0) {
        try {
          const keywordQuery = keywords.join(' ');
          const keywordChunks = await VectorService.searchSimilar(keywordQuery, {
            topK: Math.ceil(topK * 0.3), // 30%来自关键词检索
            minScore: vectorConfig.relaxedMinScore // 使用宽松阈值以提高匹配率
          });

          // 获取案例信息
          const caseIds = [...new Set(keywordChunks.map(c => c.case_id).filter(Boolean))];
          const cases = await Promise.all(
            caseIds.map(id => CaseModel.findById(id))
          );
          const caseMap = new Map(cases.filter(Boolean).map(c => [c.id, c]));

          keywordResult.contexts = keywordChunks.map(chunk => {
            const caseInfo = caseMap.get(chunk.case_id);
            return {
              chunk_id: chunk.chunk_id,
              case_id: chunk.case_id,
              case_title: caseInfo?.title || '',
              case_industry: caseInfo?.industry || '',
              case_scenario: caseInfo?.scenario || '',
              content: chunk.content,
              score: chunk.score * 0.8, // 关键词检索的权重稍低
              metadata: chunk.metadata
            };
          });

          keywordResult.relatedCases = Array.from(new Set(keywordChunks.map(c => c.case_id)))
            .map(id => {
              const caseInfo = caseMap.get(id);
              return caseInfo ? {
                id: caseInfo.id,
                title: caseInfo.title,
                industry: caseInfo.industry,
                scenario: caseInfo.scenario,
                technology: caseInfo.technology,
                description: caseInfo.description
              } : null;
            })
            .filter(Boolean);
        } catch (error) {
          logger.warn('关键词检索失败，仅使用语义检索:', error);
        }
      }
    }

    // 合并结果并去重
    const allContexts = [...semanticResult.contexts, ...keywordResult.contexts];
    const contextMap = new Map();
    
    for (const ctx of allContexts) {
      const key = `${ctx.case_id}_${ctx.chunk_id}`;
      if (!contextMap.has(key) || contextMap.get(key).score < ctx.score) {
        contextMap.set(key, ctx);
      }
    }

    const mergedContexts = Array.from(contextMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // 合并相关案例：只包含最终 contexts 中涉及的案例
    const relatedCaseMap = new Map();
    
    // 从最终合并的 contexts 中提取案例ID
    const finalCaseIds = new Set(mergedContexts.map(ctx => ctx.case_id).filter(Boolean));
    
    // 只添加在最终 contexts 中出现的案例
    [...semanticResult.relatedCases, ...keywordResult.relatedCases].forEach(c => {
      if (finalCaseIds.has(c.id) && !relatedCaseMap.has(c.id)) {
        relatedCaseMap.set(c.id, c);
      }
    });

    return {
      contexts: mergedContexts,
      relatedCases: Array.from(relatedCaseMap.values())
    };
  }
}

export default RAGService;

