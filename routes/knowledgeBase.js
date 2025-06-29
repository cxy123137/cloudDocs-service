import express from 'express';
import { addKnowledgeBase, getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase,
   getKnowledgeBaseByUserId } from '../service/knowledgeBase.js';
import { getBasePermissionCode } from '../service/permission.js';
const knowledgeBaseRouter = express.Router();

// 创建单个知识库
knowledgeBaseRouter.post('/addKnowledgeBase', async (req, res) => {
  try {
    const { baseName, baseDesc, ownerId } = req.body;
    const result = await addKnowledgeBase(baseName, baseDesc, ownerId);
    res.status(201).json({ code: 201, message: "知识库创建成功", data: result.insertedId });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// 根据id访问知识库，并返回用户对知识库的权限
knowledgeBaseRouter.get('/getKnowledgeBase', async (req, res) => {
  try {
    const { id, userId } = req.query;
    const knowledgeBases = await getKnowledgeBase(id);
    
    const permissionCode = await getBasePermissionCode(id, userId);
    res.status(200).json({ code: 200, message: "查询成功", data: knowledgeBases, permissionCode: permissionCode });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 获取用户名下所有知识库的列表
knowledgeBaseRouter.get('/getKnowledgeBases', async (req, res) => {
  try {
    const { userId } = req.query;
    const knowledgeBases = await getKnowledgeBaseByUserId(userId);
    res.status(200).json({ code: 200, message: "查询成功", data: knowledgeBases });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message })  ;
  }
});

// 编辑知识库元信息
knowledgeBaseRouter.put('/updateBase/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { baseName, baseDesc, valid } = req.body;
    const result = await updateKnowledgeBase(id, baseName, baseDesc, valid);
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
