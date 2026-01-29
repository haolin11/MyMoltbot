# CasePilot 后端服务

基于RAG增强的项目方案生成器后端服务。

## 技术栈

- Node.js + Express
- MySQL (关系型数据库)
- Chroma (向量数据库)
- 通义千问 API (大模型)

## 前置要求

在开始之前，请确保已安装以下工具：

- **Node.js** (推荐 v18 或更高版本)
- **npm** (通常随 Node.js 一起安装)
- **MySQL** (关系型数据库)
- **Docker** (用于运行 Chroma 向量数据库)

### 安装 Node.js 和 npm

如果系统中没有安装 Node.js，可以使用以下方法安装：

**方法1：使用 nvm（推荐）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.zshrc  # 或 source ~/.bashrc

# 安装 Node.js LTS 版本
nvm install --lts
nvm use --lts
```

**方法2：使用包管理器（Ubuntu/Debian）**

```bash
# 使用 NodeSource 仓库安装
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

安装完成后，验证安装：

```bash
node --version
npm --version
```

### 安装 MySQL

**Ubuntu/Debian:**

```bash
# 更新包列表
sudo apt update

# 安装 MySQL 服务器
sudo apt install -y mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 运行安全配置脚本（可选，但推荐）
sudo mysql_secure_installation
```

安装完成后，验证安装：

```bash
mysql --version
```

### 安装 Docker

**Ubuntu/Debian:**

**方法1：使用 Ubuntu 官方仓库（推荐，简单快速）**

```bash
# 更新包列表
sudo apt update

# 安装 Docker（来自 Ubuntu 官方仓库）
sudo apt install -y docker.io

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（可选，避免每次使用 sudo）
sudo usermod -aG docker $USER
# 注意：需要重新登录才能生效
```

**配置 Docker 镜像加速器（推荐）：**

如果拉取镜像时遇到超时或速度慢的问题，可以配置国内镜像加速器：

```bash
# 1. 创建或编辑 Docker daemon 配置文件
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

# 2. 重新加载 Docker 配置
sudo systemctl daemon-reload

# 3. 重启 Docker 服务
sudo systemctl restart docker
```

**故障排除：**

**问题1：如果之前尝试安装 Docker 官方仓库版本失败**

需要先清理相关配置：

```bash
# 1. 删除 Docker 仓库配置文件
sudo rm -f /etc/apt/sources.list.d/docker.list

# 2. 删除 Docker GPG 密钥文件
sudo rm -f /etc/apt/keyrings/docker.gpg

# 3. 更新包列表（此时应该不再有错误）
sudo apt update

# 4. 使用方法1（Ubuntu 官方仓库）安装
sudo apt install -y docker.io
```

**问题2：拉取镜像超时或连接失败**

配置镜像加速器（见上方"配置 Docker 镜像加速器"部分），然后重新尝试：

```bash
docker run hello-world
```

安装完成后，验证安装：

```bash
docker --version
docker run hello-world
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `env.example` 为 `.env` 并填写配置：

```bash
# Windows (Git Bash)
cp env.example .env

# 或者手动创建 .env 文件，复制 env.example 的内容并修改
```

主要配置项：
- `DB_*`: MySQL数据库配置
- `DASHSCOPE_API_KEY`: 通义千问API密钥
- `CHROMA_HOST/PORT`: Chroma向量数据库地址

### 3. 启动Chroma向量数据库

使用Docker启动Chroma：

**前台运行（用于测试）：**
```bash
docker run -p 8000:8000 --name chroma chromadb/chroma
```
⚠️ **注意**：前台运行时，按 `Ctrl+C` 会停止容器。容器停止后，`docker ps` 不会显示（因为只显示运行中的容器）。

**后台运行（推荐，无持久化）：**
```bash
docker run -d -p 8000:8000 --name chroma chromadb/chroma
```

**后台运行（推荐，带持久化存储）：**
```bash
# 创建数据目录
mkdir -p ./chroma-data

# 启动容器并挂载数据目录
docker run -d -p 8000:8000 \
  -v $(pwd)/chroma-data:/chroma/chroma \
  --name chroma chromadb/chroma
```

**说明：**
- `-d`: 后台运行（detached mode），容器在后台运行，终端可以继续使用
- `--name chroma`: 给容器命名为 `chroma`，方便后续管理
- `-p 8000:8000`: 将容器的8000端口映射到主机的8000端口
- `-v $(pwd)/chroma-data:/chroma/chroma`: 将数据持久化到本地目录（**强烈推荐**，避免容器重启后数据丢失）

**管理容器：**

查看运行中的容器：
```bash
docker ps
```

查看所有容器（包括已停止的）：
```bash
docker ps -a
```

停止容器：
```bash
docker stop chroma
```

启动已停止的容器：
```bash
docker start chroma
```

重启容器：
```bash
docker restart chroma
```

删除容器（需要先停止）：
```bash
docker stop chroma
docker rm chroma #(/CONTAINER ID)
```

**注意：**
- 如果容器已存在，再次运行 `docker run` 会报错。可以先删除旧容器，或使用 `docker start chroma` 启动已存在的容器
- 如果使用 `--name` 命名了容器，下次启动时使用 `docker start chroma` 即可，无需重新运行 `docker run`
- ⚠️ **重要**：如果不使用 `-v` 挂载数据目录，容器重启或删除后数据会丢失！建议使用持久化存储配置
- 如果之前没有使用持久化存储，需要重新导入数据：`npm run import-cases`

### 4. 初始化数据库

创建MySQL数据库和表结构：

```bash
# 先创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS casepilot;"

# 运行初始化脚本（会自动创建表结构）
npm run init-db
```

### 5. 导入案例数据

```bash
npm run import-cases
```

### 6. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## API接口

### 案例库管理

- `GET /api/cases` - 获取案例列表
- `GET /api/cases/:id` - 获取案例详情
- `POST /api/cases/import` - 导入案例
- `GET /api/cases/search` - 搜索案例

### 方案生成

- `POST /api/solutions/generate` - 生成方案
- `GET /api/solutions/:id` - 获取方案详情
- `GET /api/solutions` - 获取方案列表

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── models/          # 数据库模型
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑
│   ├── utils/           # 工具函数
│   └── app.js           # 应用入口
├── scripts/
│   └── initDatabase.js  # 数据初始化脚本
└── package.json
```

## 开发说明

- 使用ES模块 (type: "module")
- 日志文件保存在 `logs/` 目录
- 上传文件保存在 `uploads/` 目录

