import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * 文档解析服务
 */
export class DocumentParser {
  /**
   * 解析docx文件
   */
  static async parseDocx(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      
      // 提取HTML格式（保留格式）
      const htmlResult = await mammoth.convertToHtml({ buffer });
      
      return {
        text,
        html: htmlResult.value,
        metadata: {
          format: 'docx',
          filePath
        }
      };
    } catch (error) {
      logger.error('解析docx文件失败:', error);
      throw new Error(`解析docx文件失败: ${error.message}`);
    }
  }

  /**
   * 解析pdf文件
   */
  static async parsePdf(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        html: null,
        metadata: {
          format: 'pdf',
          filePath,
          pages: data.numpages,
          info: data.info
        }
      };
    } catch (error) {
      logger.error('解析pdf文件失败:', error);
      throw new Error(`解析pdf文件失败: ${error.message}`);
    }
  }

  /**
   * 处理图片文件
   */
  static async processImage(imagePath) {
    try {
      const stats = fs.statSync(imagePath);
      const metadata = await sharp(imagePath).metadata();
      
      return {
        path: imagePath,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        metadata: {
          format: 'image',
          filePath: imagePath
        }
      };
    } catch (error) {
      logger.error('处理图片失败:', error);
      throw new Error(`处理图片失败: ${error.message}`);
    }
  }

  /**
   * 文档分块策略
   * 按段落分割，每块500-1000字符
   */
  static chunkText(text, options = {}) {
    const {
      chunkSize = 800,
      chunkOverlap = 100,
      minChunkSize = 200
    } = options;

    // 按段落分割
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const chunks = [];
    let currentChunk = '';
    let currentSize = 0;

    for (const paragraph of paragraphs) {
      const paraSize = paragraph.length;

      // 如果单个段落超过chunkSize，需要进一步分割
      if (paraSize > chunkSize) {
        // 先保存当前chunk
        if (currentChunk.length >= minChunkSize) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = '';
        currentSize = 0;

        // 分割大段落
        const sentences = paragraph.split(/[。！？\n]/).filter(s => s.trim());
        for (const sentence of sentences) {
          const sentenceSize = sentence.length;
          
          if (currentSize + sentenceSize > chunkSize && currentChunk.length >= minChunkSize) {
            chunks.push(currentChunk.trim());
            // 保留重叠部分
            const overlapText = currentChunk.slice(-chunkOverlap);
            currentChunk = overlapText + sentence;
            currentSize = overlapText.length + sentenceSize;
          } else {
            currentChunk += sentence;
            currentSize += sentenceSize;
          }
        }
      } else {
        // 如果加上当前段落会超过chunkSize，保存当前chunk
        if (currentSize + paraSize > chunkSize && currentChunk.length >= minChunkSize) {
          chunks.push(currentChunk.trim());
          // 保留重叠部分
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText + '\n\n' + paragraph;
          currentSize = overlapText.length + paraSize;
        } else {
          if (currentChunk) {
            currentChunk += '\n\n';
          }
          currentChunk += paragraph;
          currentSize += paraSize;
        }
      }
    }

    // 添加最后一个chunk
    if (currentChunk.trim().length >= minChunkSize) {
      chunks.push(currentChunk.trim());
    }

    return chunks.map((content, index) => ({
      chunk_id: uuidv4(),
      chunk_index: index,
      content,
      token_count: this.estimateTokenCount(content),
      metadata: {
        chunk_size: content.length,
        chunk_index: index
      }
    }));
  }

  /**
   * 估算token数量（简单估算：中文1字符≈1token，英文1词≈1token）
   */
  static estimateTokenCount(text) {
    // 简单估算：中文字符数 + 英文单词数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  /**
   * 从文档中提取元数据（标题、行业、技术类型等）
   * 使用简单的规则提取，后续可以用AI增强
   */
  static extractMetadata(text, filePath) {
    const metadata = {
      title: '',
      industry: '',
      scenario: '',
      technology: '',
      description: ''
    };

    // 从文件名提取标题
    const fileName = path.basename(filePath, path.extname(filePath));
    metadata.title = fileName;

    // 从文本中提取信息（简单规则）
    const lines = text.split('\n').slice(0, 50); // 只看前50行
    
    // 查找标题（通常是第一行或包含"项目"、"系统"等关键词的行）
    for (const line of lines.slice(0, 10)) {
      if (line.length > 5 && line.length < 50) {
        if (line.includes('项目') || line.includes('系统') || line.includes('方案')) {
          metadata.title = line.trim();
          break;
        }
      }
    }

    // 提取描述（前200字符）
    metadata.description = text.substring(0, 200).replace(/\s+/g, ' ').trim();

    return metadata;
  }

  /**
   * 解析项目目录
   * 扫描目录中的docx、pdf、图片文件
   */
  static async parseProjectDirectory(projectDir) {
    const files = fs.readdirSync(projectDir);
    const result = {
      docx: null,
      pdf: null,
      images: [],
      metadata: {}
    };

    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const ext = path.extname(file).toLowerCase();
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        if (ext === '.docx') {
          result.docx = filePath;
        } else if (ext === '.pdf') {
          result.pdf = filePath;
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
          result.images.push(filePath);
        }
      }
    }

    // 解析文档内容
    if (result.docx) {
      try {
        const docContent = await this.parseDocx(result.docx);
        result.metadata = this.extractMetadata(docContent.text, result.docx);
        result.text = docContent.text;
        result.html = docContent.html;
      } catch (error) {
        logger.error(`解析docx失败 ${result.docx}:`, error);
      }
    } else if (result.pdf) {
      try {
        const pdfContent = await this.parsePdf(result.pdf);
        result.metadata = this.extractMetadata(pdfContent.text, result.pdf);
        result.text = pdfContent.text;
      } catch (error) {
        logger.error(`解析pdf失败 ${result.pdf}:`, error);
      }
    }

    // 处理图片
    if (result.images.length > 0) {
      try {
        result.imageData = await this.processImage(result.images[0]); // 使用第一张图片
      } catch (error) {
        logger.error('处理图片失败:', error);
      }
    }

    return result;
  }

  /**
   * 完整解析流程：解析文档 -> 分块 -> 返回结构化数据
   */
  static async parseAndChunk(projectDir, options = {}) {
    const projectData = await this.parseProjectDirectory(projectDir);
    
    if (!projectData.text) {
      throw new Error('未找到可解析的文档文件');
    }

    // 文档分块
    const chunks = this.chunkText(projectData.text, options);

    return {
      ...projectData,
      chunks,
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, chunk) => sum + chunk.token_count, 0)
    };
  }
}

export default DocumentParser;

