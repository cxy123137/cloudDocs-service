# CloudDocs Service

一个基于Node.js的文档管理系统，提供文档创建、编辑、分享和AI摘要等功能。

## 主要功能

- 📝 **文档管理**: 创建、编辑、删除文档
- 👥 **用户管理**: 用户注册、登录、权限管理
- 📚 **知识库**: 组织和管理文档集合
- 🤖 **AI摘要**: 基于豆包AI的智能文档摘要生成
- ⏰ **定时任务**: 自动检查和更新文档摘要
- 🔐 **权限控制**: 细粒度的文档和知识库权限管理

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MongoDB
- **AI服务**: 豆包AI (豆包ARK)
- **认证**: JWT
- **实时通信**: WebSocket

## 快速开始

### 环境要求

- Node.js 18+
- MongoDB 4.4+
- 豆包AI API密钥

### 安装和配置

1. **克隆项目**
```bash
git clone <repository-url>
cd cloudDocs-service
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env` 文件并配置：
```bash
# 豆包AI API密钥
ARK_API_KEY=your_actual_api_key_here
ARK_MODEL_ID=doubao-seed-1-6-250615

# MongoDB连接配置
MONGODB_URI=mongodb://localhost:27017
DB_NAME=cloudDoc

# JWT密钥
JWT_SECRET_KEY=your_jwt_secret_key_here
```

4. **启动服务**
```bash
npm start
```

服务将在 `http://localhost:8000` 启动。

## AI摘要功能

系统集成了基于豆包AI的智能摘要功能：

- **自动生成**: 文档内容≥50字符时自动生成摘要
- **智能控制**: 摘要严格控制在200字以内
- **定时更新**: 每30分钟自动检查文档更新
- **完整API**: 提供生成、获取、更新、删除等操作

详细API文档请参考 [AI_SUMMARY_API_DOCS.md](./AI_SUMMARY_API_DOCS.md)

## API文档

- **用户认证**: `/login/*`
- **文档管理**: `/document/*`
- **知识库**: `/knowledgeBase/*`
- **权限管理**: `/permission/*`
- **AI摘要**: `/summary/*`

## 许可证

MIT License

项目连接mongodb
1.官网下载mongodb后，在bin目录下执行命令启动db，窗口不要关闭
    mongod -dbpath D:\MongoDB\data\db
2.vscode下载mongodb for VScode的插件，左侧栏会显示一个叶子（没有的话重启）
3.使用插件，输入localhost:27017，连接本机mongodb
4.点击createNewPlayground，用以下建表语句替换掉，左上角执行建表语句


项目启动
1.第一次启动项目，需要下载依赖
npm install
2.启动
npm start

接口测试
可以用网页版的apifox，也可以用postman，或者浏览器输入接口地址