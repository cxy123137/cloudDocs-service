// 路由配置文件
import { knowledgeBaseRouter } from './知识库.js';
import { documentsrouter } from './文档.js';
import { userRouter } from './用户.js';
import { loginRouter } from './登录校验.js';

export default function (app) {
  app.use('/knowledgeBase', knowledgeBaseRouter);
  app.use('/documents', documentsrouter);
  app.use('/user', userRouter);
  app.use('/login', loginRouter);
}