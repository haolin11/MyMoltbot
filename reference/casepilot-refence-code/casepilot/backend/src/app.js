import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import { initChroma } from './config/chroma.js';
import logger from './utils/logger.js';

// 导入路由
import caseRoutes from './routes/cases.js';
import solutionRoutes from './routes/solutions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 获取当前文件的目录路径（ES模块）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UI_DIR = path.join(__dirname, '../../UI');
const DATABASE_DIR = path.join(__dirname, '../../database');

// 中间件
app.use(cors({
  origin: 'http://112.126.60.211:8080', // 前端服务的地址（端口需与实际一致）
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的请求方法
  allowedHeaders: ['Content-Type'] // 允许的请求头
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/cases', caseRoutes);
app.use('/api/solutions', solutionRoutes);

// 根路径重定向到首页（必须在静态文件服务之前）
app.get('/', (req, res) => {
  res.sendFile(path.join(UI_DIR, 'P-HOME.html'));
});

// 提供静态文件服务（UI目录）
app.use(express.static(UI_DIR));

// 提供database目录的静态文件服务（用于访问案例图片等资源）
app.use('/database', express.static(DATABASE_DIR));

// 404处理 - 对于API请求返回JSON，对于页面请求返回404页面
app.use((req, res) => {
  // 如果是API请求，返回JSON错误
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  // 否则返回404页面
  res.status(404).sendFile(path.join(UI_DIR, 'P-HOME.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
async function startServer() {
  // 测试数据库连接
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn('数据库连接失败，部分功能可能不可用');
  }

  // 初始化Chroma
  const chromaConnected = await initChroma();
  if (!chromaConnected) {
    logger.warn('Chroma连接失败，向量检索功能可能不可用');
  }

  app.listen(PORT, () => {
    logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
    logger.info(`📚 API文档: http://localhost:${PORT}/health`);
  });
}

startServer().catch(err => {
  logger.error('服务器启动失败:', err);
  process.exit(1);
});

export default app;

