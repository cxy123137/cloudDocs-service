import express from 'express';
import { connectToDatabase } from '../db.js';
import jwt from 'jsonwebtoken';
import { setContext, getContext } from '../context.js';
import { addUser } from '../service/user.js';
import 'dotenv/config';

const loginRouter = express.Router();
const { db } = await connectToDatabase();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// 中间件，AsyncLocalStorage需要提前初始化run()一块区域
loginRouter.use(setContext);

// 登录接口（自动注册，验证后存储用户信息到上下文）
loginRouter.get('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await db.collection('users').findOne({username: username});

    if (!user) {
      // 自动注册
      await addUser(req);
      user = await db.collection('users').findOne({username: username});
      console.log(user);
    } else if (password !== user.password) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 存储用户信息到上下文
    let context = getContext();
    context.user = { 
      id: user._id, 
      username: user.username 
    };

    // 生成 JWT
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "服务器错误，请稍后再试", error: err.message });
  }
});

export { loginRouter }

