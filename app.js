import express from 'express';
import router from './routes/index.js'; // 引入路由模块
const app = express();
const port = 8000;


// 请求头跨域配置
const cors = require('cors');
app.use(cors({
  origin: '*', // 生产环境建议指定前端域名
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders: 'Content-Type, Authorization',
}));

// 请求json处理拦截器
app.use(express.json());
router(app);

// 启动服务器
app.listen(port, () => {
  console.log(`服务已启动：http://localhost:${port}`);
});