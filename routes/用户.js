import express from 'express';
import { connectToDatabase } from '../db.js';

const userRouter = express.Router();

userRouter.get('/testDBGet', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('users').find().toArray();
    res.status(200).json({success: true, data: users});
  } catch (err) {
    res.status(500).json({success: false, error: '服务器错误，请稍后再试'});
  }
});

export { userRouter }