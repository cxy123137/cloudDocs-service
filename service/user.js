import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import { addKnowledgeBase } from './knowledgeBase.js';

const { db } = await connectToDatabase();

// 添加新用户
export async function addUser(username, password, friends = []) {
  const newUser = {
    _id: new ObjectId(), // 引入mongodb库来生成ObjectId
    username,
    friends: friends.map((friend) => new ObjectId(friend)), // 默认为空数组
    password, // 生产环境密码需要加密
    defaultKnowledgeBaseId: undefined,
    valid: 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };
  // 先根据ObjectId生成的用户id，添加一个默认的知识库
  const base = await addKnowledgeBase('我的知识库', '我的知识库', new ObjectId(newUser._id)); // 默认添加一个知识库
  const baseId = base.insertedId;
  // 关联获取到的知识库id，更新用户信息
  newUser.defaultKnowledgeBaseId = baseId;
  const addResult = await db.collection('users').insertOne(newUser);

  return addResult;
}

// 获取用户信息
export async function getUser(id) {
  let users;
  if (id) {
    users = await db.collection('users').findOne({ _id: new ObjectId(id), valid: 1 });
  } else {
    users = await db.collection('users').find({ valid: 1 }).toArray();
  }
  return users;
}

// 修改用户信息
export async function updateUser(id, username, friends, password, valid) {
  const updateFields = {
    $set: {
      username,
      friends: friends ? friends.map((friend) => new ObjectId(friend)) : undefined,
      password, // 注意：在真实应用中，密码不应该明文存储
      valid,
      updateTime: new Date(),
    },
  };
  const result = await db.collection('users').updateOne({ _id: new ObjectId(id), valid: 1 }, updateFields);
  return result;
}

// 删除用户：后续优化为假删
export async function deleteUser(id) {
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result;
}

// 获取用户好友
// 获取好友列表
// 获取好友申请列表
// 添加好友申请
// 处理好友申请
// 删除好友