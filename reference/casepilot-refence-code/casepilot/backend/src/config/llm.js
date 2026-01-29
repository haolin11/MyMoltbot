import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.DASHSCOPE_API_KEY;
const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';

if (!apiKey) {
  console.warn('⚠️  警告: DASHSCOPE_API_KEY未配置');
}

// 注意：当前使用HTTP请求方式直接调用DashScope API
// 如需使用官方SDK，请参考阿里云DashScope文档

export { apiKey, baseUrl };

