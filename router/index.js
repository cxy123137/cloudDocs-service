// 路由配置文件
import { knowledgeBaseRouter } from '../routes/knowledgeBase.js';
import { documentsRouter } from '../routes/doc.js';
import { userRouter } from '../routes/user.js';
import { loginRouter } from '../routes/login.js';
import { docVersionsRouter } from '../routes/docVersion.js';
import { permissionRouter } from '../routes/permission.js';
import { summaryRouter } from '../routes/summary.js';
import { commentRouter } from '../routes/comment.js';

export default function (app) {
  app.use('/knowledgeBase', knowledgeBaseRouter);
  app.use('/document', documentsRouter);
  app.use('/user', userRouter);
  app.use('/login', loginRouter);
  app.use('/docVersion', docVersionsRouter);
  app.use('/permission', permissionRouter);
  app.use('/summary', summaryRouter);
  app.use('/comment', commentRouter);
}