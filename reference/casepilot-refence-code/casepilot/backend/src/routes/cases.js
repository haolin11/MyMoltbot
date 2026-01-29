import express from 'express';
import { CaseModel } from '../models/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/cases
 * 获取案例列表（支持分页、搜索、筛选、排序）
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      industry,
      scenario,
      technology,
      keyword,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const result = await CaseModel.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      industry,
      scenario,
      technology,
      keyword,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('获取案例列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取案例列表失败',
      message: error.message
    });
  }
});

/**
 * GET /api/cases/:id
 * 获取案例详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const caseData = await CaseModel.findById(parseInt(id));

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      });
    }

    // 增加浏览次数
    await CaseModel.incrementViewCount(parseInt(id));

    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    logger.error('获取案例详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取案例详情失败',
      message: error.message
    });
  }
});

/**
 * GET /api/cases/search
 * 语义搜索案例（使用向量检索）
 */
router.get('/search', async (req, res) => {
  try {
    const { q, topK = 5 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: '缺少查询参数 q'
      });
    }

    // 使用RAG服务进行语义搜索
    const { RAGService } = await import('../services/ragService.js');
    const { VectorService } = await import('../services/vectorService.js');
    const { vectorConfig } = await import('../config/vector.js');

    // 向量检索
    const similarChunks = await VectorService.searchSimilar(q, {
      topK: parseInt(topK),
      minScore: vectorConfig.defaultMinScore
    });

    // 获取案例信息
    const caseIds = [...new Set(similarChunks.map(c => c.case_id).filter(Boolean))];
    const cases = await Promise.all(
      caseIds.map(id => CaseModel.findById(id))
    );

    // 构建结果，包含相似度分数
    const results = cases
      .filter(Boolean)
      .map(caseInfo => {
        const chunks = similarChunks.filter(chunk => chunk.case_id === caseInfo.id);
        const maxScore = Math.max(...chunks.map(c => c.score), 0);
        
        return {
          ...caseInfo,
          relevance_score: maxScore,
          matched_chunks: chunks.length
        };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score);

    res.json({
      success: true,
      data: results,
      query: q,
      total: results.length
    });
  } catch (error) {
    logger.error('语义搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '语义搜索失败',
      message: error.message
    });
  }
});

/**
 * POST /api/cases/import
 * 批量导入案例（从database目录）
 * 注意：这个接口主要用于初始化数据，实际使用时应该通过脚本调用
 */
router.post('/import', async (req, res) => {
  try {
    // 这个功能主要在初始化脚本中实现
    res.json({
      success: false,
      message: '请使用初始化脚本导入案例: npm run init-db'
    });
  } catch (error) {
    logger.error('导入案例失败:', error);
    res.status(500).json({
      success: false,
      error: '导入案例失败',
      message: error.message
    });
  }
});

export default router;
