import express from 'express';
import {addUser, getUser, updateUser, deleteUser} from '../service/用户.js';

import { connectToDatabase } from '../db.js'; // 确保你有一个连接到MongoDB的函数
const { db } = await connectToDatabase(); // 获取数据库连接

const userRouter = express.Router();

// test接口
userRouter.get('/testDBGet', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.status(200).json({code: 200, message: "success", data: users});
  } catch (err) {
    res.status(500).json({code: 500, message: "服务器错误，请稍后再试", error: err.message});
  }
});

// 创建新用户
userRouter.post('/addUser', async (req, res) => {
  try {
    // 调用serv层方法，创建新用户
    const result = await addUser(req);
    res.status(201).json({code: 201, message: "用户创建成功", data: result.insertedId});
  } catch (err) {
    res.status(500).json({code: 500, message: "服务器错误，请稍后再试", error: err.message});
  }
});

// 获取所有用户或根据ID获取特定用户
userRouter.get('/getUser', async (req, res) => {
  try {
    const users = await getUser(req);
    res.status(200).json({code: 200, message: "查询成功", data: users});
  } catch (err) {
    res.status(500).json({code: 500, message: "服务器错误，请稍后再试", error: err.message});
  }
});

// 更新用户信息
userRouter.put('/updateUser/:id', async (req, res) => {
  try {
    const result = await updateUser(req);
    if (result.matchedCount === 0) {
      return res.status(404).json({code: 404, message: "用户未找到"});
    }
    res.status(200).json({code: 200, message: "用户更新成功"});
  } catch (err) {
    res.status(500).json({code: 500, message: "服务器错误，请稍后再试", error: err.message});
  }
});

// 删除用户：后续优化为假删
userRouter.delete('/destroyUser/:id', async (req, res) => {
  try {
    const result = await deleteUser(req);
    if (result.deletedCount === 0) {
      return res.status(404).json({code: 404, message: "用户未找到"});
    }
    res.status(200).json({code: 200, message: "用户删除成功"});
  } catch (err) {
    res.status(500).json({code: 500, message: "服务器错误，请稍后再试", error: err.message});
  }
});

// 添加好友
// 删除好友
// 获取好友列表
// 获取好友申请列表
// 同意好友申请
// 拒绝好友申请


export { userRouter }