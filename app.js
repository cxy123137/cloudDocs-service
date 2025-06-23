import express from 'express';
import cors from 'cors';
import router from './router/index.js';
import jwt from 'jsonwebtoken';
import { setupWSServer } from './routes/wss.js';
import 'dotenv/config';

const app = express();
const port = 8000;


// 请求头跨域配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 请求json处理拦截器
app.use(express.json());

// 全局拦截请求，必须登录
app.use((req, res, next) => {
  // 白名单
  if (req.path === '/login/login' || req.path === '/login/register' || req.path === '/login//refreshToken') {
    return next();
  }

  // 获取Authorization
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send('未携带token，请登录');
  }

  // 校验token
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).send('token 无效或已过期');
  }
});

// 路由注册
router(app);
// WebSocket服务
await setupWSServer();

// 启动服务器
app.listen(port, () => {
  console.log(`服务已启动：http://localhost:${port}`);
});





