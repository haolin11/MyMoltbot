import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

const chromaConfig = {
  host: process.env.CHROMA_HOST || 'localhost',
  port: parseInt(process.env.CHROMA_PORT || '8000'),
};

let chromaClient = null;
let caseCollection = null;

export async function initChroma() {
  try {
    chromaClient = new ChromaClient({
      path: `http://${chromaConfig.host}:${chromaConfig.port}`
    });
    
    // 获取或创建案例集合
    try {
      caseCollection = await chromaClient.getCollection({
        name: 'cases'
      });
      console.log('✅ Chroma集合已存在，已加载');
    } catch (error) {
      // 集合不存在，创建新集合
      caseCollection = await chromaClient.createCollection({
        name: 'cases',
        metadata: { description: '项目案例向量集合' }
      });
      console.log('✅ Chroma集合创建成功');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Chroma连接失败:', error.message);
    console.log('提示: 请确保Chroma服务已启动 (docker run -p 8000:8000 chromadb/chroma)');
    return false;
  }
}

export function getChromaClient() {
  return chromaClient;
}

export function getCaseCollection() {
  return caseCollection;
}

