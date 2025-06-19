import express from 'express';
import { connectToDatabase } from '../db.js';
import jwt from 'jsonwebtoken';
import { setContext, getContext } from '../context.js';
import { addUser, getUser } from '../service/user.js';
import 'dotenv/config';
import { getDefaultKnowledgeBaseIdByUserId } from '../service/knowledgeBase.js';

const loginRouter = express.Router();
const { db } = await connectToDatabase();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// 中间件，AsyncLocalStorage需要提前初始化run()一块区域
loginRouter.use(setContext);

// 登录接口
loginRouter.get('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await db.collection('users').findOne({username: username});

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    if (password !== user.password) {
      return res.status(401).json({ error: '密码错误' });
    }
    
    const baseId = await getDefaultKnowledgeBaseIdByUserId(user._id);
    console.log(baseId);
    
    // 存储用户信息到上下文
    let context = getContext();
    context.user = { 
      id: user._id, 
      username: user.username 
    };

    // 生成 JWT
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ code: 201, message: "登录成功", token: token, defaultKnowledgeBaseId: baseId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

// 注册接口
loginRouter.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await db.collection('users').findOne({username: username});

    if (user) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 创建新用户
    const newUser = await addUser(username, password);
    console.log(newUser);
    
    const userId = newUser.insertedId;
    console.log(userId);
    
    // 获取默认知识库id
    const baseId = await getDefaultKnowledgeBaseIdByUserId(userId);

    // 存储用户信息到上下文
    let context = getContext();
    context.user = { 
      _id: userId, 
      username: username 
    };

    // 生成 JWT
    const token = jwt.sign({ userId: userId }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ code: 200, message: "登录成功", token: token, defaultKnowledgeBaseId: baseId });
    } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { loginRouter }

