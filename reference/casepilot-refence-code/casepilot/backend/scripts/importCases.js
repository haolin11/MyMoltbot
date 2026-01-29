import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DocumentParser } from '../src/services/documentParser.js';
import { LLMService } from '../src/services/llmService.js';
import { VectorService } from '../src/services/vectorService.js';
import { CaseModel, CaseChunkModel, CaseVectorModel } from '../src/models/index.js';
import { initChroma } from '../src/config/chroma.js';
import logger from '../src/utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 导入案例数据
 */
async function importCases() {
  try {
    logger.info('开始导入案例数据...');

    // 初始化Chroma向量数据库
    logger.info('初始化Chroma向量数据库...');
    const chromaConnected = await initChroma();
    if (!chromaConnected) {
      throw new Error('Chroma连接失败，无法继续导入。请确保Chroma服务已启动 (docker run -d -p 8000:8000 --name chroma chromadb/chroma)');
    }
    logger.info('✅ Chroma连接成功');

    // 获取database目录路径
    const databaseDir = process.env.DATABASE_DIR || path.join(__dirname, '../../database');
    
    if (!fs.existsSync(databaseDir)) {
      throw new Error(`数据库目录不存在: ${databaseDir}`);
    }

    // 读取所有项目目录
    const projectDirs = fs.readdirSync(databaseDir)
      .filter(item => {
        const itemPath = path.join(databaseDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

    logger.info(`找到 ${projectDirs.length} 个项目目录`);

    let successCount = 0;
    let failCount = 0;

    for (const projectDirName of projectDirs) {
      const projectPath = path.join(databaseDir, projectDirName);
      
      try {
        logger.info(`\n处理项目: ${projectDirName}`);

        // 1. 解析项目文档
        logger.info(`  解析文档...`);
        const projectData = await DocumentParser.parseAndChunk(projectPath, {
          chunkSize: 800,
          chunkOverlap: 100
        });

        if (!projectData.text || projectData.chunks.length === 0) {
          logger.warn(`  跳过 ${projectDirName}: 未找到可解析的文档`);
          failCount++;
          continue;
        }

        // 2. 使用AI补充元数据
        logger.info(`  使用AI补充元数据...`);
        const enrichedMetadata = await LLMService.enrichCaseMetadata(
          projectData.text,
          projectData.metadata
        );

        // 3. 确定图片路径 - 优先使用visual.png
        let imagePath = null;
        const visualPngPath = path.join(projectPath, 'visual.png');
        if (fs.existsSync(visualPngPath)) {
          imagePath = visualPngPath;
          logger.info(`  找到visual.png: ${visualPngPath}`);
        } else if (projectData.imageData) {
          imagePath = projectData.imageData.path;
        } else if (projectData.images.length > 0) {
          imagePath = projectData.images[0];
        }

        // 4. 确定文档路径
        const docPath = projectData.docx || projectData.pdf;

        // 5. 创建案例记录
        logger.info(`  创建案例记录...`);
        const caseId = await CaseModel.create({
          title: enrichedMetadata.title || projectDirName,
          industry: enrichedMetadata.industry || '',
          scenario: enrichedMetadata.scenario || '',
          technology: enrichedMetadata.technology || '',
          description: enrichedMetadata.description || projectData.metadata.description || '',
          summary: projectData.text.substring(0, 300),
          image_path: imagePath ? path.relative(path.join(__dirname, '../..'), imagePath) : null,
          doc_path: docPath ? path.relative(path.join(__dirname, '../..'), docPath) : null,
          price: 0
        });

        logger.info(`  案例ID: ${caseId}`);

        // 6. 保存文档分块
        logger.info(`  保存文档分块 (${projectData.chunks.length} 个)...`);
        const chunksWithCaseId = projectData.chunks.map(chunk => ({
          ...chunk,
          case_id: caseId
        }));
        
        await CaseChunkModel.createMany(chunksWithCaseId);

        // 7. 生成向量并存储
        logger.info(`  生成向量并存储到Chroma...`);
        const vectorIds = await VectorService.addVectors(chunksWithCaseId, caseId);

        // 8. 保存向量映射
        logger.info(`  保存向量映射...`);
        for (let i = 0; i < chunksWithCaseId.length; i++) {
          await CaseVectorModel.create({
            case_id: caseId,
            chunk_id: chunksWithCaseId[i].chunk_id,
            vector_id: vectorIds[i]
          });
        }

        logger.info(`  ✅ 项目 ${projectDirName} 导入成功`);
        successCount++;

        // 避免API限流，添加延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`  ❌ 项目 ${projectDirName} 导入失败:`, error);
        failCount++;
      }
    }

    logger.info(`\n导入完成:`);
    logger.info(`  成功: ${successCount}`);
    logger.info(`  失败: ${failCount}`);

    process.exit(0);
  } catch (error) {
    logger.error('导入案例数据失败:', error);
    process.exit(1);
  }
}

// 运行导入
importCases();

