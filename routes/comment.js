import express from 'express';
import { addComment, getCommentsByDocId, getCommentById, updateComment, 
    deleteComment, deleteCommentsByDocId, saveMapping, getMappingByDocId } from '../service/comment.js';

const commentRouter = express.Router();

// 新增评论
commentRouter.post('/addComment', async(req, res) => {
  try {
    const { docId, userId, content } = req.body;
    console.log(docId, userId, content,"获取的参数");
    
    const result = await addComment({ docId, userId, content });
    res.status(200).send({code: 200, message: '评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 获取评论列表
commentRouter.get('/getCommentsByDocId', async(req, res) => {
  try {
    const { docId } = req.query;
    const result = await getCommentsByDocId(docId);
    res.status(200).send({code: 200, message: '获取评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 获取单个评论（暂时没用）
commentRouter.get('/getCommentById', async(req, res) => {
  try {
    const { commentId } = req.query;
    const result = await getCommentById(commentId);
    res.status(200).send({code: 200, message: '获取评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 更新评论
commentRouter.put('/updateComment', async(req, res) => {
  try {
    const { commentId, content } = req.query;
    const result = await updateComment(commentId, content);
    res.status(200).send({code: 200, message: '更新评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 删除评论
commentRouter.delete('/deleteComment', async(req, res) => {
  try {
    const { commentId } = req.query;
    const result = await deleteComment(commentId);
    res.status(200).send({code: 200, message: '删除评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 根据文档ID删除所有评论
commentRouter.delete('/deleteCommentsByDocId', async(req, res) => {
  try {
    const { docId } = req.query;
    const result = await deleteCommentsByDocId(docId);
    res.status(200).send({code: 200, message: '删除评论成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 保存评论样式映射
commentRouter.post('/saveMapping', async(req, res) => {
  try {
    const { docId, map } = req.body;
    const result = await saveMapping({ docId, map });
    res.status(200).send({code: 200, message: '保存评论样式映射成功', data: result});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});

// 获取评论样式映射
commentRouter.get('/getMappingByDocId', async(req, res) => {
  try {
    const { docId } = req.query;
    const result = await getMappingByDocId(docId);
    res.status(200).send({code: 200, message: '获取评论样式映射成功', data: result, docId: docId});
  } catch (error) {
    res.status(500).send({code: 500, message: '服务器错误'});
  }
});


export { commentRouter };