# 快速开始指南

## 前置要求

1. **Node.js** >= 16.0.0
2. **MySQL** >= 5.7
3. **Docker** (用于运行Chroma向量数据库)

## 安装步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `env.example` 为 `.env` 并填写配置：

```bash
# Windows (Git Bash)
cp env.example .env

# 或者手动创建 .env 文件，复制 env.example 的内容并修改
```

编辑 `.env` 文件，填写以下关键配置：

```env
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=casepilot

# 通义千问API配置（必填）
DASHSCOPE_API_KEY=your_dashscope_api_key

# Chroma向量数据库配置
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### 3. 启动Chroma向量数据库

使用Docker启动Chroma：

```bash
docker run -d -p 8000:8000 \
  -v $(pwd)/chroma-data:/chroma/chroma \
  --name chroma chromadb/chroma
```

**重要说明**：
- `-v` 参数用于将Chroma数据持久化到本地 `chroma-data` 目录
- **首次创建容器时**必须使用 `-v` 参数
- **容器停止后重启**（使用 `docker start chroma`）**不需要**再次使用 `-v` 参数，因为容器配置已保存
- **如果删除容器后重新创建**，需要再次使用 `-v` 参数，否则数据会丢失

**常用命令**：
```bash
# 启动已存在的容器
docker start chroma

# 停止容器
docker stop chroma

# 查看容器状态
docker ps | grep chroma

# 删除容器（会丢失数据，除非使用了-v参数）
docker rm chroma
```

### 4. 创建MySQL数据库

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS casepilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. 初始化数据库表结构

```bash
npm run init-db
```

### 6. 导入案例数据

```bash
npm run import-cases
```

这个脚本会：
- 扫描 `database` 目录下的所有项目
- 解析docx/pdf文件
- 提取文本并分块
- 使用AI补充元数据
- 生成向量并存储到Chroma
- 保存到MySQL数据库

**注意**：导入过程可能需要较长时间，因为需要调用通义千问API生成向量。

### 7. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动。

## 前端配置

### 1. 修改API地址（如需要）

编辑 `UI/js/api.js`，修改 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### 2. 启动前端

可以使用任何静态文件服务器，例如：

```bash
# 使用Python
cd UI
python -m http.server 8080

# 或使用Node.js的http-server
npx http-server -p 8080
```

## 测试API

### 健康检查

```bash
curl http://localhost:3000/health
```

### 获取案例列表

```bash
curl http://localhost:3000/api/cases?page=1&pageSize=6
```

### 生成方案

```bash
curl -X POST http://localhost:3000/api/solutions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "智能客服系统",
    "description": "需要一个智能客服系统，支持多轮对话",
    "method": "text"
  }'
```

## 常见问题

### 1. Chroma连接失败

确保Chroma容器正在运行：
```bash
docker ps | grep chroma
```

如果未运行，启动它：
```bash
docker start chroma
```

### 2. MySQL连接失败

检查MySQL服务是否运行，以及 `.env` 中的数据库配置是否正确。

### 3. 通义千问API调用失败

- 检查 `DASHSCOPE_API_KEY` 是否正确配置
- 确认API密钥有效且有足够的额度
- 查看日志文件 `logs/error.log` 了解详细错误信息

### 4. 导入案例时向量生成失败

- 检查网络连接
- 确认API密钥有效
- 查看控制台输出的错误信息

## 下一步

- 查看 `README.md` 了解项目结构
- 查看API文档了解所有接口
- 根据需要调整配置和参数

