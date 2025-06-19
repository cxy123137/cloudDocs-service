// 路由配置文件
import { knowledgeBaseRouter } from '../routes/knowledgeBase.js';
import { documentsrouter } from '../routes/doc.js';
import { userRouter } from '../routes/user.js';
import { loginRouter } from '../routes/login.js';

export default function (app) {
  app.use('/knowledgeBase', knowledgeBaseRouter);
  app.use('/documents', documentsrouter);
  app.use('/user', userRouter);
  app.use('/login', loginRouter);
}