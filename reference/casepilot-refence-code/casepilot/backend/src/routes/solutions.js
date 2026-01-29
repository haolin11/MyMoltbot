import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SolutionModel } from '../models/index.js';
import { RAGService } from '../services/ragService.js';
import { LLMService } from '../services/llmService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/solutions/generate
 * 生成项目方案
 */
router.post('/generate', async (req, res) => {
  try {
    const userInput = req.body;
    const {
      title,
      description,
      method = 'text', // 'text' or 'form'
      industry,
      technology,
      budget,
      objectives,
      requirements
    } = userInput;

    // 验证输入
    if (method === 'text' && (!title || !description)) {
      return res.status(400).json({
        success: false,
        error: '文本描述方式需要提供title和description'
      });
    }

    if (method === 'form' && (!title || !industry || !technology || !objectives)) {
      return res.status(400).json({
        success: false,
        error: '结构化表单方式需要提供title、industry、technology和objectives'
      });
    }

    // 创建方案记录（状态：生成中）
    const solutionId = uuidv4();
    logger.info(`创建方案记录 [${solutionId}], method: ${method}, userInput keys: ${Object.keys(userInput).join(', ')}`);
    await SolutionModel.create({
      solution_id: solutionId,
      user_input: userInput,
      input_method: method,
      status: 'generating'
    });
    logger.info(`方案记录创建成功 [${solutionId}]`);

    // 异步生成方案（不阻塞响应）
    generateSolutionAsync(solutionId, userInput, method).catch(error => {
      logger.error(`方案生成失败 [${solutionId}]:`, error);
      SolutionModel.update(solutionId, {
        status: 'failed',
        generated_content: `生成失败: ${error.message}`
      });
    });

    // 立即返回方案ID
    res.json({
      success: true,
      data: {
        solution_id: solutionId,
        status: 'generating',
        message: '方案生成中，请稍后查询结果'
      }
    });
  } catch (error) {
    logger.error('创建方案生成任务失败:', error);
    res.status(500).json({
      success: false,
      error: '创建方案生成任务失败',
      message: error.message
    });
  }
});

/**
 * 异步生成方案
 */
async function generateSolutionAsync(solutionId, userInput, method) {
  try {
    logger.info(`开始生成方案 [${solutionId}]`);

    // 1. RAG检索相关案例
    logger.info(`[${solutionId}] RAG检索相关案例...`);
    const ragResult = await RAGService.enhancedRetrieve(userInput, {
      topK: 6, // 增加检索数量以获取更多参考数据
      inputMethod: method
    });

    logger.info(`[${solutionId}] 检索到 ${ragResult.contexts.length} 个相关文本块，${ragResult.relatedCases.length} 个相关案例`);

    // 2. 提取评估指标汇总（用于前端可视化）
    const evaluationMetrics = await extractEvaluationMetrics(ragResult.relatedCases, ragResult.contexts);
    logger.info(`[${solutionId}] 提取到 ${evaluationMetrics.length} 个评估指标`);

    // 3. 更新方案记录：保存相关案例信息和指标
    await SolutionModel.update(solutionId, {
      related_case_ids: ragResult.relatedCases.map(c => c.id),
      related_chunks: ragResult.contexts.map(ctx => ({
        chunk_id: ctx.chunk_id,
        case_id: ctx.case_id,
        case_title: ctx.case_title,
        score: ctx.score
      })),
      evaluation_metrics: evaluationMetrics
    });

    // 4. 使用优化的PE工程生成方案
    logger.info(`[${solutionId}] 调用LLM生成方案（优化PE版）...`);
    const generatedContent = await LLMService.generateSolutionWithRAG(
      userInput,
      ragResult.contexts,
      {
        inputMethod: method,
        model: 'qwen-plus', // 使用更强模型
        temperature: 0.5 // 降低温度提高专业性
      }
    );

    logger.info(`[${solutionId}] 方案生成完成`);

    // 5. 更新方案记录：保存生成的内容
    await SolutionModel.update(solutionId, {
      status: 'completed',
      generated_content: generatedContent
    });

    logger.info(`[${solutionId}] 方案保存完成`);
  } catch (error) {
    logger.error(`方案生成失败 [${solutionId}]:`, error);
    await SolutionModel.update(solutionId, {
      status: 'failed',
      generated_content: `生成失败: ${error.message}`
    });
    throw error;
  }
}

/**
 * 从关联案例中提取评估指标汇总
 * 用于前端可视化展示
 */
async function extractEvaluationMetrics(relatedCases, contexts) {
  const metrics = [];
  const { CaseModel } = await import('../models/index.js');
  
  for (const caseInfo of relatedCases) {
    try {
      const fullCase = await CaseModel.findById(caseInfo.id);
      if (!fullCase) continue;
      
      // 解析metrics字段
      let caseMetrics = {};
      if (fullCase.metrics) {
        try {
          caseMetrics = typeof fullCase.metrics === 'string' 
            ? JSON.parse(fullCase.metrics) 
            : fullCase.metrics;
        } catch (e) {
          logger.warn(`解析案例 ${caseInfo.id} 的metrics失败`);
        }
      }
      
      // 构建结构化的指标数据
      if (Object.keys(caseMetrics).length > 0 || fullCase.acceptance_standards) {
        metrics.push({
          case_id: caseInfo.id,
          case_title: fullCase.title,
          industry: fullCase.industry,
          technology: fullCase.technology,
          metrics: caseMetrics,
          acceptance_standards: fullCase.acceptance_standards,
          // 计算相似度得分（从上下文中获取）
          relevance_score: contexts.find(c => c.case_id === caseInfo.id)?.score || 0
        });
      }
    } catch (error) {
      logger.warn(`提取案例 ${caseInfo.id} 指标失败:`, error.message);
    }
  }
  
  // 按相关度排序
  return metrics.sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * GET /api/solutions/:id
 * 获取方案详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const solution = await SolutionModel.findBySolutionId(id);

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: '方案不存在'
      });
    }

    res.json({
      success: true,
      data: solution
    });
  } catch (error) {
    logger.error('获取方案详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取方案详情失败',
      message: error.message
    });
  }
});

/**
 * GET /api/solutions
 * 获取方案列表
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      user_id,
      status
    } = req.query;

    const solutions = await SolutionModel.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      user_id,
      status
    });

    res.json({
      success: true,
      data: solutions
    });
  } catch (error) {
    logger.error('获取方案列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取方案列表失败',
      message: error.message
    });
  }
});

/**
 * POST /api/solutions/:id/chat
 * 针对方案进行进一步对话提问
 */
router.post('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 获取方案详情
    const solution = await SolutionModel.findBySolutionId(id);
    if (!solution) {
      return res.status(404).json({
        success: false,
        error: '方案不存在'
      });
    }

    // 如果方案还在生成中，返回提示
    if (solution.status === 'generating') {
      return res.json({
        success: true,
        data: {
          reply: '方案正在生成中，请稍后再提问。'
        }
      });
    }

    // 构建对话上下文
    const userInput = solution.user_input || {};
    const solutionContent = solution.generated_content || '';
    const userInputText = userInput.method === 'text' 
      ? `项目标题：${userInput.title || ''}\n项目描述：${userInput.description || ''}`
      : `项目标题：${userInput.title || ''}\n所属行业：${userInput.industry || ''}\n技术方向：${userInput.technology || ''}\n项目目标：${userInput.objectives || ''}`;

    // 构建提示词
    const prompt = `你是一位专业的项目方案顾问。用户已经生成了一个项目方案，现在用户针对这个方案提出了新的问题。

原始项目需求：
${userInputText}

已生成的方案内容：
${solutionContent}

用户的新问题：
${message.trim()}

请基于已生成的方案内容，专业、详细地回答用户的问题。如果问题涉及方案的修改或补充，请提供具体的建议。回答要清晰、有条理，使用专业术语。

回答：`;

    logger.info(`[${id}] 处理对话消息: ${message.substring(0, 50)}...`);

    // 调用LLM生成回复
    const reply = await LLMService.generateText(prompt, {
      model: 'qwen-turbo',
      temperature: 0.7,
      maxTokens: 2000
    });

    logger.info(`[${id}] 对话回复生成完成`);

    res.json({
      success: true,
      data: {
        reply: reply
      }
    });
  } catch (error) {
    logger.error('处理对话消息失败:', error);
    res.status(500).json({
      success: false,
      error: '处理对话消息失败',
      message: error.message
    });
  }
});

export default router;
