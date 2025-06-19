import express from 'express';
import { addKnowledgeBase, getKnowledgeBase, getKnowledgeBaseByOwnerId, updateKnowledgeBase, deleteKnowledgeBase } from '../service/knowledgeBase.js';
const knowledgeBaseRouter = express.Router();

// 创建单个知识库
knowledgeBaseRouter.post('/addKnowledgeBase', async (req, res) => {
  try {
    const { baseName, baseDesc, ownerId, adminIds, readaUserIds, editaUserIds, docs } = req.body;
    const result = await addKnowledgeBase(baseName, baseDesc, ownerId, adminIds, readaUserIds, editaUserIds, docs);
    res.status(201).json({ code: 201, message: "知识库创建成功", data: result.insertedId });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// 根据单个id读取单个知识库，或者所有知识库
// 后期需要的话，改为根据 ids 获取多个知识库
knowledgeBaseRouter.get('/getKnowledgeBase', async (req, res) => {
  try {
    const { id } = req.query;
    const knowledgeBases = await getKnowledgeBase(id);
    res.status(200).json({ code: 200, message: "查询成功", data: knowledgeBases });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 编辑知识库元信息，对应的是权限管理
knowledgeBaseRouter.put('/updateBase/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { baseName, baseDesc, adminIds, readaUserIds, editaUserIds, docs, valid } = req.body;
    const result = await updateKnowledgeBase(id, baseName, baseDesc, adminIds, readaUserIds, editaUserIds, docs, valid);
    if (result.matchedCount === 0) return res.status(404).json({ code: 404, message: "知识库未找到" });
    res.status(200).json({ code: 200, message: "知识库更新成功" });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 删除知识库
knowledgeBaseRouter.delete('/deleteBase/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteKnowledgeBase(id);
    if (result.deletedCount === 0) return res.status(404).json({ code: 404, message: "知识库未找到" });
    res.status(200).json({ code: 200, message: "知识库删除成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { knowledgeBaseRouter }
