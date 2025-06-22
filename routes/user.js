import express from 'express';
import { addUser, getUser, updateUser, deleteUser } from '../service/user.js';

const userRouter = express.Router();

// test接口
userRouter.get('/testDBGet', async (req, res) => {
  try {
    const { db } = await connectToDatabase(); // 获取数据库连接
    const users = await db.collection('users').find().toArray();
    res.status(200).json({ code: 200, message: "success", data: users });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 创建新用户
userRouter.post('/addUser', async (req, res) => {
  try {
    const { nickName, username, password, friends } = req.body;
    const result = await addUser({ nickName, username, password, friends });
    res.status(201).json({ code: 200, message: "用户创建成功", data: result.insertedId });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 获取所有用户或根据ID获取特定用户
userRouter.get('/getUser', async (req, res) => {
  try {
    const { id } = req.query;
    const users = await getUser(id);
    res.status(200).json({ code: 200, message: "查询成功", data: users });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 更新用户信息
userRouter.put('/updateUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nickName, username, friends, password, valid } = req.body;
    const result = await updateUser({ id, nickName, username, friends, password, valid });
    if (result.matchedCount === 0) {
      return res.status(404).json({ code: 404, message: "用户未找到" });
    }
    res.status(200).json({ code: 200, message: "用户更新成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 删除用户：后续优化为假删
userRouter.delete('/destroyUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ code: 404, message: "用户未找到" });
    }
    res.status(200).json({ code: 200, message: "用户删除成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { userRouter }
