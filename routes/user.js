import express from 'express';
import { addUser, getUser, updateUser, deleteUser, getStrangerByName, getFriends, 
  getApplyFriends, addFriend, handleApplyFriend, deleteFriend } from '../service/user.js';

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
    const { nickName, username, password, friends, applyfriends } = req.body;
    const result = await addUser({ nickName, username, password, friends, applyfriends });
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

// 根据用户名获取陌生人信息
userRouter.get('/getStrangerByName', async (req, res) => {
  try {
    const { username, userId } = req.query;
    const stranger = await getStrangerByName(username, userId);
    if (!stranger) {
      return res.status(404).json({ code: 404, message: "陌生人未找到或已是您的好友" });
    }
    res.status(200).json({ code: 200, message: "查询成功", data: stranger });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 获取好友列表
userRouter.get('/getFriends', async (req, res) => {
  try {
    const { userId } = req.query;
    const friends = await getFriends(userId);
    res.status(200).json({ code: 200, message: "查询成功", data: friends });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 获取申请好友列表
userRouter.get('/getApplyFriends', async (req, res) => {
  try {
    const { userId } = req.query;
    const applyFriends = await getApplyFriends(userId);
    res.status(200).json({ code: 200, message: "查询成功", data: applyFriends });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 添加好友
userRouter.post('/addFriend', async (req, res) => {
  try {
    const { userId, friendId } = req.query;
    const result = await addFriend(userId, friendId);
    if (result.matchedCount === 0) {
      return res.status(404).json({ code: 404, message: "用户未找到" });
    }
    res.status(200).json({ code: 200, message: "添加好友成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 处理好友申请
userRouter.put('/handleApplyFriend', async (req, res) => {
  try {
    const { userId, friendId } = req.query;
    const result = await handleApplyFriend(userId, friendId);
    if (result.result1.matchedCount === 0 || result.result2.matchedCount === 0) {
      return res.status(404).json({ code: 404, message: "用户未找到" });
    }
    res.status(200).json({ code: 200, message: "处理好友申请成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 删除好友
userRouter.delete('/deleteFriend', async (req, res) => {
  try {
    const { userId, friendId } = req.query;
    const result = await deleteFriend(userId, friendId);
    if (result.result1.matchedCount === 0 || result.result2.matchedCount === 0) {
      return res.status(404).json({ code: 404, message: "用户未找到" });
    }
    res.status(200).json({ code: 200, message: "删除好友成功" });
  } catch (err) {
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { userRouter }
