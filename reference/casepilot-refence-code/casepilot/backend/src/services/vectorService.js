import { getCaseCollection } from '../config/chroma.js';
import { LLMService } from './llmService.js';
import { vectorConfig } from '../config/vector.js';
import logger from '../utils/logger.js';

/**
 * 向量服务
 * 负责向量的存储和检索
 */
export class VectorService {
  /**
   * 将文本块转换为向量并存储到Chroma
   */
  static async addVectors(chunks, caseId) {
    const collection = getCaseCollection();
    if (!collection) {
      throw new Error('Chroma集合未初始化');
    }

    try {
      // 提取文本内容
      const texts = chunks.map(chunk => chunk.content);
      
      // 批量生成向量
      logger.info(`开始为 ${texts.length} 个文本块生成向量...`);
      const embeddings = await LLMService.embedTexts(texts);
      logger.info(`向量生成完成`);

      // 准备Chroma数据
      const ids = chunks.map(chunk => chunk.chunk_id);
      const metadatas = chunks.map(chunk => ({
        case_id: caseId.toString(),
        chunk_id: chunk.chunk_id,
        chunk_index: chunk.chunk_index,
        token_count: chunk.token_count || 0
      }));

      // 添加到Chroma集合
      await collection.add({
        ids: ids,
        embeddings: embeddings,
        metadatas: metadatas,
        documents: texts
      });

      logger.info(`成功添加 ${chunks.length} 个向量到Chroma`);

      return ids;
    } catch (error) {
      logger.error('添加向量失败:', error);
      throw new Error(`添加向量失败: ${error.message}`);
    }
  }

  /**
   * 根据查询文本检索相似向量
   */
  static async searchSimilar(queryText, options = {}) {
    const {
      topK = vectorConfig.defaultTopK,
      caseId = null, // 如果指定，只搜索特定案例
      minScore = vectorConfig.relaxedMinScore // 最小相似度分数，默认使用宽松阈值
    } = options;

    const collection = getCaseCollection();
    if (!collection) {
      throw new Error('Chroma集合未初始化');
    }

    try {
      // 将查询文本转换为向量
      const queryEmbedding = await LLMService.embedText(queryText);

      // 构建查询条件（Chroma不接受空的where对象）
      const queryOptions = {
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      };
      
      // 只有当caseId存在时才添加where条件
      if (caseId) {
        queryOptions.where = {
          case_id: caseId.toString()
        };
      }

      // 在Chroma中搜索
      const results = await collection.query(queryOptions);

      // 处理结果
      const similarChunks = [];
      
      if (results.ids && results.ids[0]) {
        const ids = results.ids[0];
        const distances = results.distances[0] || [];
        const metadatas = results.metadatas[0] || [];
        const documents = results.documents[0] || [];

        for (let i = 0; i < ids.length; i++) {
          // Chroma返回的是距离（越小越相似），转换为相似度分数（0-1）
          const distance = distances[i] || 0;
          const score = 1 / (1 + distance); // 简单的距离转相似度公式

          if (score >= minScore) {
            similarChunks.push({
              chunk_id: ids[i],
              case_id: metadatas[i]?.case_id ? parseInt(metadatas[i].case_id) : null,
              chunk_index: metadatas[i]?.chunk_index || 0,
              content: documents[i] || '',
              score: score,
              distance: distance,
              metadata: metadatas[i] || {}
            });
          }
        }
      }

      // 按相似度分数排序（降序）
      similarChunks.sort((a, b) => b.score - a.score);

      logger.info(`检索到 ${similarChunks.length} 个相似文本块`);

      return similarChunks;
    } catch (error) {
      logger.error('向量检索失败:', error);
      throw new Error(`向量检索失败: ${error.message}`);
    }
  }

  /**
   * 删除案例的所有向量
   */
  static async deleteCaseVectors(caseId) {
    const collection = getCaseCollection();
    if (!collection) {
      throw new Error('Chroma集合未初始化');
    }

    try {
      // 查询该案例的所有向量ID
      const results = await collection.get({
        where: {
          case_id: caseId.toString()
        }
      });

      if (results.ids && results.ids.length > 0) {
        // 删除这些向量
        await collection.delete({
          ids: results.ids
        });
        logger.info(`删除案例 ${caseId} 的 ${results.ids.length} 个向量`);
      }

      return true;
    } catch (error) {
      logger.error('删除向量失败:', error);
      throw new Error(`删除向量失败: ${error.message}`);
    }
  }

  /**
   * 获取集合统计信息
   */
  static async getCollectionStats() {
    const collection = getCaseCollection();
    if (!collection) {
      throw new Error('Chroma集合未初始化');
    }

    try {
      const count = await collection.count();
      return {
        totalVectors: count
      };
    } catch (error) {
      logger.error('获取集合统计失败:', error);
      return {
        totalVectors: 0
      };
    }
  }
}

export default VectorService;

