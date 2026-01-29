import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 案例模型
 */
export class CaseModel {
  /**
   * 创建案例
   */
  static async create(caseData) {
    const {
      title,
      industry,
      scenario,
      technology,
      description,
      summary,
      image_path,
      doc_path,
      price = 0,
      metrics = null,
      acceptance_standards = null
    } = caseData;

    const [result] = await pool.execute(
      `INSERT INTO cases (title, industry, scenario, technology, description, summary, image_path, doc_path, price, metrics, acceptance_standards)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, industry, scenario, technology, description, summary, image_path, doc_path, price, metrics ? JSON.stringify(metrics) : null, acceptance_standards]
    );

    return result.insertId;
  }

  /**
   * 根据ID获取案例
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM cases WHERE id = ? AND status = 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 获取案例列表
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      industry,
      scenario,
      technology,
      keyword,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let sql = 'SELECT * FROM cases WHERE status = 1';
    const params = [];

    // 筛选条件
    if (industry && industry !== 'all') {
      sql += ' AND industry = ?';
      params.push(industry);
    }
    if (scenario && scenario !== 'all') {
      sql += ' AND scenario = ?';
      params.push(scenario);
    }
    if (technology && technology !== 'all') {
      sql += ' AND technology = ?';
      params.push(technology);
    }
    if (keyword) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    // 排序
    const validSortFields = ['created_at', 'view_count', 'download_count', 'favorite_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDir}`;

    // 分页 - LIMIT 和 OFFSET 不能使用占位符，需要直接拼接
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM cases WHERE status = 1';
    const countParams = [];
    if (industry && industry !== 'all') {
      countSql += ' AND industry = ?';
      countParams.push(industry);
    }
    if (scenario && scenario !== 'all') {
      countSql += ' AND scenario = ?';
      countParams.push(scenario);
    }
    if (technology && technology !== 'all') {
      countSql += ' AND technology = ?';
      countParams.push(technology);
    }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      countParams.push(keywordPattern, keywordPattern);
    }

    const [countRows] = await pool.execute(countSql, countParams);
    const total = countRows[0].total;

    return {
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 更新案例
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE cases SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 增加浏览次数
   */
  static async incrementViewCount(id) {
    await pool.execute(
      'UPDATE cases SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
  }

  /**
   * 增加下载次数
   */
  static async incrementDownloadCount(id) {
    await pool.execute(
      'UPDATE cases SET download_count = download_count + 1 WHERE id = ?',
      [id]
    );
  }
}

/**
 * 案例分块模型
 */
export class CaseChunkModel {
  /**
   * 批量创建分块
   */
  static async createMany(chunks) {
    if (chunks.length === 0) return [];

    // 构建批量插入的SQL语句
    const placeholders = chunks.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const sql = `INSERT INTO case_chunks (case_id, chunk_id, chunk_index, content, metadata, token_count)
       VALUES ${placeholders}`;

    // 展平所有值到一个数组中
    const values = chunks.flatMap(chunk => [
      chunk.case_id,
      chunk.chunk_id,
      chunk.chunk_index,
      chunk.content,
      JSON.stringify(chunk.metadata || {}),
      chunk.token_count || 0
    ]);

    await pool.execute(sql, values);

    return chunks.map(c => c.chunk_id);
  }

  /**
   * 根据案例ID获取所有分块
   */
  static async findByCaseId(caseId) {
    const [rows] = await pool.execute(
      'SELECT * FROM case_chunks WHERE case_id = ? ORDER BY chunk_index',
      [caseId]
    );
    return rows;
  }

  /**
   * 根据分块ID获取分块
   */
  static async findByChunkId(chunkId) {
    const [rows] = await pool.execute(
      'SELECT * FROM case_chunks WHERE chunk_id = ?',
      [chunkId]
    );
    return rows[0] || null;
  }
}

/**
 * 向量映射模型
 */
export class CaseVectorModel {
  /**
   * 创建向量映射
   */
  static async create(mapping) {
    const [result] = await pool.execute(
      `INSERT INTO case_vectors (case_id, chunk_id, vector_id)
       VALUES (?, ?, ?)`,
      [mapping.case_id, mapping.chunk_id, mapping.vector_id]
    );
    return result.insertId;
  }

  /**
   * 根据向量ID获取映射
   */
  static async findByVectorId(vectorId) {
    const [rows] = await pool.execute(
      'SELECT * FROM case_vectors WHERE vector_id = ?',
      [vectorId]
    );
    return rows[0] || null;
  }

  /**
   * 根据案例ID获取所有向量映射
   */
  static async findByCaseId(caseId) {
    const [rows] = await pool.execute(
      'SELECT * FROM case_vectors WHERE case_id = ?',
      [caseId]
    );
    return rows;
  }
}

/**
 * 方案模型
 */
export class SolutionModel {
  /**
   * 创建方案
   */
  static async create(solutionData) {
    const {
      solution_id,
      user_input,
      input_method,
      generated_content = null,
      related_case_ids = null,
      related_chunks = null,
      status = 'generating',
      user_id = null
    } = solutionData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO solutions (solution_id, user_input, input_method, generated_content, related_case_ids, related_chunks, status, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          solution_id,
          JSON.stringify(user_input),
          input_method,
          generated_content,
          related_case_ids ? JSON.stringify(related_case_ids) : null,
          related_chunks ? JSON.stringify(related_chunks) : null,
          status,
          user_id
        ]
      );

      return result.insertId;
    } catch (error) {
      logger.error('SolutionModel.create 失败:', {
        error: error.message,
        code: error.code,
        solution_id,
        input_method,
        status
      });
      throw error;
    }
  }

  /**
   * 根据方案ID获取方案
   */
  static async findBySolutionId(solutionId) {
    const [rows] = await pool.execute(
      'SELECT * FROM solutions WHERE solution_id = ?',
      [solutionId]
    );
    
    if (rows.length === 0) return null;

    const solution = rows[0];
    
    // 安全解析JSON字段（MySQL JSON类型可能已经是对象，也可能是字符串）
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === 'object') return field; // 已经是对象
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          logger.warn('JSON解析失败，返回原始值:', { field, error: e.message });
          return field;
        }
      }
      return field;
    };
    
    return {
      ...solution,
      user_input: parseJsonField(solution.user_input) || {},
      related_case_ids: parseJsonField(solution.related_case_ids) || [],
      related_chunks: parseJsonField(solution.related_chunks) || [],
      evaluation_metrics: parseJsonField(solution.evaluation_metrics) || []
    };
  }

  /**
   * 更新方案
   */
  static async update(solutionId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'related_case_ids' || key === 'related_chunks' || key === 'user_input' || key === 'evaluation_metrics') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(solutionId);
    const [result] = await pool.execute(
      `UPDATE solutions SET ${fields.join(', ')} WHERE solution_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取方案列表
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      user_id,
      status
    } = options;

    let sql = 'SELECT * FROM solutions WHERE 1=1';
    const params = [];

    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    // 分页 - LIMIT 和 OFFSET 不能使用占位符，需要直接拼接
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(sql, params);

    // 安全解析JSON字段
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === 'object') return field; // 已经是对象
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          logger.warn('JSON解析失败，返回原始值:', { field, error: e.message });
          return field;
        }
      }
      return field;
    };
    
    const solutions = rows.map(row => ({
      ...row,
      user_input: parseJsonField(row.user_input) || {},
      related_case_ids: parseJsonField(row.related_case_ids) || [],
      related_chunks: parseJsonField(row.related_chunks) || [],
      evaluation_metrics: parseJsonField(row.evaluation_metrics) || []
    }));

    return solutions;
  }
}

