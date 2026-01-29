import dotenv from 'dotenv';

dotenv.config();

/**
 * 向量检索配置
 */
export const vectorConfig = {
  // 默认相似度阈值（用于RAG检索）
  defaultMinScore: parseFloat(process.env.VECTOR_MIN_SCORE || '0.5'),
  
  // 宽松相似度阈值（用于关键词检索等场景）
  relaxedMinScore: parseFloat(process.env.VECTOR_RELAXED_MIN_SCORE || '0.3'),
  
  // 严格相似度阈值（用于高精度检索）
  strictMinScore: parseFloat(process.env.VECTOR_STRICT_MIN_SCORE || '0.7'),
  
  // 默认检索数量
  defaultTopK: parseInt(process.env.VECTOR_DEFAULT_TOP_K || '5')
};

// 验证配置值
if (vectorConfig.defaultMinScore < 0 || vectorConfig.defaultMinScore > 1) {
  throw new Error('VECTOR_MIN_SCORE 必须在 0-1 之间');
}

if (vectorConfig.relaxedMinScore < 0 || vectorConfig.relaxedMinScore > 1) {
  throw new Error('VECTOR_RELAXED_MIN_SCORE 必须在 0-1 之间');
}

if (vectorConfig.strictMinScore < 0 || vectorConfig.strictMinScore > 1) {
  throw new Error('VECTOR_STRICT_MIN_SCORE 必须在 0-1 之间');
}

export default vectorConfig;

