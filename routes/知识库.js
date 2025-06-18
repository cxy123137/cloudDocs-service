import express from 'express';
import { addKnowledgeBase, getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from '../service/知识库.js';
import app from '../app.js';
const knowledgeBaseRouter = express.Router();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 上线后只允许配置为前端ip端口
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 创建知识库
knowledgeBaseRouter.post('/addKnowledgeBase', async (req, res) => {
  console.log('req.body:', req.body);
  try {
    const result = await addKnowledgeBase(req);
    res.status(201).json({ code: 201, message: "知识库创建成功", data: result.insertedId });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 读取知识库
knowledgeBaseRouter.get('/getKnowledgeBase', async (req, res) => {
  try {
    const knowledgeBases = await getKnowledgeBase(req);
    res.status(200).json({ code: 200, message: "查询成功", data: knowledgeBases });
  } catch (error) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: error.message });
  }
});

// 更新知识库
knowledgeBaseRouter.put('/updateBase/:id', async (req, res) => {
  try {
    const result = await updateKnowledgeBase(req);
    if (result.matchedCount === 0) return res.status(404).json({ code: 404, message: "知识库未找到" });
    res.status(200).json({ code: 200, message: "知识库更新成功" });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 删除知识库
knowledgeBaseRouter.delete('/deleteBase/:id', async (req, res) => {
  try {
    const result = await deleteKnowledgeBase(req);
    if (result.deletedCount === 0) return res.status(404).json({ code: 404, message: "知识库未找到" });
    res.status(200).json({ code: 200, message: "知识库删除成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { knowledgeBaseRouter }