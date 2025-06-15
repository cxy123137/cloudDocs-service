import express from 'express';
import { knowledgeBaseRouter } from './routes/知识库.js';
import { documentsrouter } from './routes/文档.js';
import { userRouter } from './routes/用户.js';
import { loginRouter } from './routes/登录校验.js';
const app = express();
const port = 8000;

// 请求json处理拦截器
app.use(express.json());
app.use('/knowledgeBase', knowledgeBaseRouter);
app.use('/documents', documentsrouter);
app.use('/user', userRouter);
app.use('/login', loginRouter);

// 启动服务器
app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});