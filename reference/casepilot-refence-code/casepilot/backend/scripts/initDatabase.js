import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    logger.info('开始初始化数据库...');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../src/models/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // 分割SQL语句（按分号分割）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement) {
        try {
          await pool.execute(statement);
          logger.info('✅ 执行SQL语句成功');
        } catch (error) {
          // 忽略表已存在的错误
          if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_DUP_KEYNAME') {
            logger.error('执行SQL失败:', error.message);
            throw error;
          } else {
            logger.info('⚠️  表或索引已存在，跳过');
          }
        }
      }
    }

    logger.info('✅ 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();

