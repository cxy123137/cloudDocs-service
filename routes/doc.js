import express from 'express';
import { addDocument, getDocument, getDocumentByBaseId, updateDocument, 
  deleteDocument, getDocumentByRecentlyUserId, getDocsByPermission } from '../service/doc.js';
import { getDocPermissionCode } from '../service/permission.js';

const documentsRouter = express.Router();

// 新建文档
documentsRouter.post('/addDoc', async (req, res) => {
  try {
    const { title = "未命名文档", baseId, content = {}, ownerId, valid = 1 } = req.body;
    console.log('创建文档参数:', req.body);
    
    // 参数验证
    if (!baseId) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: baseId' });
    }
    if (!ownerId) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: ownerId' });
    }
    
    // 验证baseId格式
    if (typeof baseId !== 'string' || baseId.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(baseId)) {
      return res.status(400).json({ code: 400, message: 'baseId格式错误，必须为24位hex字符串' });
    }
    
    // 验证ownerId格式
    if (typeof ownerId !== 'string' || ownerId.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(ownerId)) {
      return res.status(400).json({ code: 400, message: 'ownerId格式错误，必须为24位hex字符串' });
    }
    
    const result = await addDocument({
      title,
      baseId,
      content,
      ownerId,
      valid,
    });
    console.log('文档创建结果:', result);
    
    res.status(201).json({ code: 201, message: '文档新建成功', insertedId: result.insertedId });
  } catch (error) {
    console.error('创建文档失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: error.message });
  }
});

// 查询文档
documentsRouter.get('/getDoc', async (req, res) => {
  try {
    const { userId, docId } = req.query;
    
    // 参数验证
    if (!docId) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: docId' });
    }
    if (!userId) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: userId' });
    }
    
    const doc = await getDocument({ docId, userId });
    if (!doc) {
      return res.status(404).json({ code: 404, message: '文档不存在' });
    }
    
    const permissionCode = await getDocPermissionCode(docId, userId);
    res.status(200).json({ 
      code: 200, 
      message: '查询成功', 
      data: doc, 
      permissionCode: permissionCode || 0 
    });
  } catch (error) {
    console.error('查询文档失败:', error);
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
    const result = await deleteDocument(id);
    if (result.modifiedCount === 1) {
      res.status(200).json({ code: 200, message: '文档删除成功' });
    } else {
      res.status(404).json({ code: 404, message: '文档不存在' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

export { documentsRouter };