import express from 'express';
import { addDocVersion, getDocVersions, getDocVersionContent, deleteDocVersion } from '../service/docVersion.js';

const docVersionsRouter = express.Router();

// 新增版本，根据最新文档来存储的，所以调用前必须先保存一次文档
docVersionsRouter.post('/addDocVersion/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const result = await addDocVersion({ docId });
    res.status(201).json({ code: 201, message: '文档版本新建成功', insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 查询文档版本列表
docVersionsRouter.get('/getDocVersions/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const versions = await getDocVersions({ docId });
    res.status(200).json({ code: 200, message: '查询成功', data: versions });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 查询文档版本内容
docVersionsRouter.get('/getDocVersion/:docVersionId', async (req, res) => {
  try {
    const { docVersionId } = req.params;
    const docVersion = await getDocVersionContent({ docVersionId });
    res.status(200).json({ code: 200, message: '查询成功', data: docVersion });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

// 删除文档版本
docVersionsRouter.delete('/deleteDocVersion/:docVersionId', async (req, res) => {
  try {
    const { docVersionId } = req.params;
    const result = await deleteDocVersion({ docVersionId });
    if (result.deletedCount === 1) {
      res.status(200).json({ code: 200, message: '版本删除成功', data: result.matchedCount });
    } else {
      res.status(404).json({ code: 404, message: '版本不存在' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: err.message });
  }
});

export { docVersionsRouter };