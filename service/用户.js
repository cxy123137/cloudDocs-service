import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

export async function addUser(req) {
  const newUser = {
    _id: new ObjectId(), // 引入mongodb库来生成ObjectId
    Username: req.body.Username,
    friends: (req.body.friends || []).map((friend) => new ObjectId(friend)) || [], // 默认为空数组
    password: req.body.password, // 密码需要加密
    valid: req.body.valid || 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };
  const addResult = await db.collection('users').insertOne(newUser);
  return addResult;
}

export async function getUser(req) {
  let users;
  if (req.query.id) {
    users = await db.collection('users').findOne({_id: new ObjectId(req.query.id), valid: 1});
  } else {
    users = await db.collection('users').find({valid: 1}).toArray();
  }
  return users;
}

// 修改用户信息
export async function updateUser(req) {
  const updateFields = {
    $set: {
      Username: req.body.Username,
      friends: (req.body.friends || []).map((friend) => new ObjectId(friend)),
      password: req.body.password, // 注意：在真实应用中，密码不应该明文存储
      valid: req.body.valid, // 默认为1，表示有效
      updateTime: new Date(),
    },
  };
  const result = await db.collection('users').updateOne({_id: new ObjectId(req.params.id)}, updateFields);
  return result;
}

// 记得改成假删，valid为0
export async function deleteUser(req) {
  const result = await db.collection('users').deleteOne({_id: new ObjectId(req.params.id)});
  return result;
}