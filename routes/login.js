import express from 'express';
import { connectToDatabase } from '../db.js';
import jwt from 'jsonwebtoken';
import { setContext, getContext } from '../context/context.js';
import { addUser, getUser } from '../service/user.js';
import 'dotenv/config';
import { getDefaultKnowledgeBaseIdByUserId } from '../service/knowledgeBase.js';

const loginRouter = express.Router();
const { db } = await connectToDatabase();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// 中间件，AsyncLocalStorage需要提前初始化run()一块区域
loginRouter.use(setContext);

// 登录接口
loginRouter.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    let user = await db.collection('users').findOne({username: username});

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    if (password !== user.password) {
      return res.status(401).json({ error: '密码错误' });
    }
    
    // 获取默认数据库id
    const baseId = await getDefaultKnowledgeBaseIdByUserId(user._id);

    // 生成 Access Token 和 Refresh Token
    const accessToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' });

    res.status(200).json({ 
      code: 201, 
      message: "登录成功", 
      token: accessToken, 
      refreshToken: refreshToken,
      userId: user._id,
      defaultKnowledgeBaseId: baseId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 刷新token接口
loginRouter.get('/refreshToken', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: '缺少refreshToken' });
  }
  try {
    // 校验 refreshToken
    const payload = jwt.verify(refreshToken, SECRET_KEY);
    // 生成新的 accessToken
    const newAccessToken = jwt.sign({ userId: payload.userId }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: 'refreshToken无效或已过期' });
  }
});

// 注册接口
loginRouter.post('/register', async (req, res) => {
  const { nickName, username, password } = req.body;
  try {
    let user = await db.collection('users').findOne({username: username});

    if (user) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 创建新用户
    await addUser({ nickName, username, password });
    res.status(200).json({ code: 200, message: "注册成功" });
    } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { loginRouter }

