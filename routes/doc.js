import express from 'express';
import { addDocument, getDocument, getDocumentByBaseId, updateDocument, 
  deleteDocument, getDocumentByRecentlyUserId, getDocsByPermission } from '../service/doc.js';
import { getDocPermissionCode } from '../service/permission.js';

const documentsRouter = express.Router();

// 新建文档
documentsRouter.post('/addDoc', async (req, res) => {
  try {
    const { title, baseId, content, ownerId, valid } = req.body;
    console.log(req.body);
    const result = await addDocument({
      title,
      baseId,
      content,
      ownerId,
      valid,
    });
    console.log(result);
    
    res.status(201).json({ code: 201, message: '文档新建成功', insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: error.message });
  }
});

// 查询文档
documentsRouter.get('/getDoc', async (req, res) => {
  try {
    const { userId, docId } = req.query;
    const doc = await getDocument({ docId, userId });
    const permissionCode = await getDocPermissionCode(docId, userId);
    res.status(200).json({ code: 200, message: '查询成功', data: doc, permissionCode: permissionCode });
  } catch (error) {
    console.log(error);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: error.message });
  }
});

// 查询用户最近访问文档
documentsRouter.get('/getRecentlyDoc', async (req, res) => {
  try {
    const userId = req.query.userId;
    const docs = await getDocumentByRecentlyUserId({ userId })
    res.status(200).json({ code: 200, message: '查询成功', data: docs });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 根据 baseId 查询文档列表
documentsRouter.get('/getDocByBaseId', async (req, res) => {
  try {
    const { baseId } = req.query;
    console.log(baseId);
    
    const docs = await getDocumentByBaseId({ baseId });
    res.status(200).json({ code: 200, message: '查询成功', data: docs });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 查询与我共享栏的文档列表（仅共享，不包括自建文档）
documentsRouter.get('/getSharedDocs', async (req, res) => {
  try {
    const userId = req.query.userId;
    const docs = await getDocsByPermission(userId);
    res.status(200).json({ code: 200, message: '查询成功', data: docs });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 更新文档数据
documentsRouter.put('/updateDoc/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, baseId, content, valid } = req.body;
    const result = await updateDocument({
      id,
      title,
      baseId,
      content,
      valid
    });
    if (result.matchedCount === 1) {
      res.status(200).json({ code: 200, message: '文档更新成功' });
    } else {
      res.status(404).json({ code: 404, message: '文档不存在' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 删除文档
documentsRouter.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteDocument({ id });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Document deleted successfully' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

export { documentsRouter };