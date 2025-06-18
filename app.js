import express from 'express';
import router from './routes/index.js'; // 引入路由模块
const app = express();
const port = 8000;

import { userRouter } from './routes/用户.js';

// 请求头跨域配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 上线后只允许配置为前端ip端口
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 请求json处理拦截器
app.use(express.json());
app.use('/user', userRouter);
// router(app);

// 启动服务器
app.listen(port, () => {
  console.log(`服务已启动：http://localhost:${port}`);
});