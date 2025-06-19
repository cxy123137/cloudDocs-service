// 路由配置文件
import { knowledgeBaseRouter } from './knowledgeBase.js';
import { documentsrouter } from './doc.js';
import { userRouter } from './user.js';
import { loginRouter } from './login.js';

export default function (app) {
  app.use('/knowledgeBase', knowledgeBaseRouter);
  app.use('/documents', documentsrouter);
  app.use('/user', userRouter);
  app.use('/login', loginRouter);
}