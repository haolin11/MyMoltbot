-- CasePilot 数据库表结构

-- 案例基本信息表
CREATE TABLE IF NOT EXISTS `cases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '案例标题',
  `industry` VARCHAR(100) COMMENT '所属行业',
  `scenario` VARCHAR(100) COMMENT '应用场景',
  `technology` VARCHAR(100) COMMENT '技术类型',
  `description` TEXT COMMENT '案例描述',
  `metrics` JSON COMMENT '评估指标（JSON格式，如{"mIoU": "0.636", "准确率": "92%"}）',
  `acceptance_standards` TEXT COMMENT '验收标准（详细的可量化验收准则）',
  `summary` TEXT COMMENT '案例摘要',
  `image_path` VARCHAR(500) COMMENT '图片路径',
  `doc_path` VARCHAR(500) COMMENT '文档路径',
  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
  `download_count` INT DEFAULT 0 COMMENT '下载次数',
  `favorite_count` INT DEFAULT 0 COMMENT '收藏次数',
  `price` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '价格',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-正常, 0-禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_industry` (`industry`),
  INDEX `idx_scenario` (`scenario`),
  INDEX `idx_technology` (`technology`),
  INDEX `idx_status` (`status`),
  FULLTEXT INDEX `ft_title_desc` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例基本信息表';

-- 案例文档分块表
CREATE TABLE IF NOT EXISTS `case_chunks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL COMMENT '案例ID',
  `chunk_id` VARCHAR(100) NOT NULL COMMENT '分块ID（UUID）',
  `chunk_index` INT NOT NULL COMMENT '分块序号',
  `content` TEXT NOT NULL COMMENT '分块内容',
  `metadata` JSON COMMENT '元数据（章节、页码等）',
  `token_count` INT COMMENT 'token数量',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_case_chunk` (`case_id`, `chunk_id`),
  INDEX `idx_case_id` (`case_id`),
  INDEX `idx_chunk_id` (`chunk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例文档分块表';

-- 案例向量映射表
CREATE TABLE IF NOT EXISTS `case_vectors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL COMMENT '案例ID',
  `chunk_id` VARCHAR(100) NOT NULL COMMENT '分块ID',
  `vector_id` VARCHAR(100) NOT NULL COMMENT 'Chroma中的向量ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_vector_id` (`vector_id`),
  INDEX `idx_case_id` (`case_id`),
  INDEX `idx_chunk_id` (`chunk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例向量映射表';

-- 生成的方案表
CREATE TABLE IF NOT EXISTS `solutions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `solution_id` VARCHAR(100) NOT NULL COMMENT '方案ID（UUID）',
  `user_input` JSON NOT NULL COMMENT '用户输入（文本描述或表单数据）',
  `input_method` VARCHAR(20) COMMENT '输入方式: text-文本描述, form-结构化表单',
  `generated_content` LONGTEXT COMMENT '生成的方案内容',
  `related_case_ids` JSON COMMENT '相关案例ID列表',
  `related_chunks` JSON COMMENT '使用的案例分块信息',
  `evaluation_metrics` JSON COMMENT '评估指标汇总（从关联案例提取的指标对比表）',
  `status` VARCHAR(20) DEFAULT 'generating' COMMENT '状态: generating-生成中, completed-已完成, failed-失败',
  `user_id` VARCHAR(100) COMMENT '用户ID（预留）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_solution_id` (`solution_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生成的方案表';

-- 案例标签表（多对多关系）
CREATE TABLE IF NOT EXISTS `case_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL COMMENT '案例ID',
  `tag` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_case_tag` (`case_id`, `tag`),
  INDEX `idx_case_id` (`case_id`),
  INDEX `idx_tag` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例标签表';

