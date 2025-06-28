import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import { addKnowledgeBase } from './knowledgeBase.js';

const { db } = await connectToDatabase();

// 安全的ObjectId转换函数
function safeObjectId(id) {
  console.log('user safeObjectId收到参数:', id, '类型:', typeof id);
  
  // 检查参数是否存在
  if (!id) {
    throw new Error('ObjectId参数不能为空');
  }
  
  // 如果已经是ObjectId对象，直接返回
  if (id.constructor.name === 'ObjectId') {
    return id;
  }
  
  // 检查参数类型
  if (typeof id !== 'string') {
    throw new Error(`ObjectId参数类型错误，期望string或ObjectId，实际${typeof id}`);
  }
  
  // 检查长度
  if (id.length !== 24) {
    throw new Error(`ObjectId长度错误，期望24位，实际${id.length}位`);
  }
  
  // 检查格式
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new Error(`ObjectId格式错误，必须为24位hex字符串，实际值: ${id}`);
  }
  
  return new ObjectId(id);
}

// 添加新用户
export async function addUser({ nickName, username, password, friends = [], applyfriends = [] }) {
  // 拼接_id的后六位作为默认的用户名
  const _id = new ObjectId();
  const newUser = {
    _id,
    nickName: nickName ? nickName : '用户' + _id.toString().slice(-6),
    username,
    friends: friends.map((friend) => new ObjectId(friend)), // 默认为空数组
    applyfriends: applyfriends.map((applyfriend) => new ObjectId(applyfriend)), // 默认为空数组
    password, // 生产环境密码需要加密
    defaultKnowledgeBaseId: undefined,
    valid: 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };

  console.log(newUser.nickName);
  
  
  // 先根据ObjectId生成的用户id，添加一个默认的知识库
  const base = await addKnowledgeBase({
    name: '我的知识库',
    description: '我的知识库',
    ownerId: _id.toString()
  }); // 默认添加一个知识库
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
    users = await db.collection('users').findOne({ _id: safeObjectId(id), valid: 1 });
  } else {
    users = await db.collection('users').find({ valid: 1 }).toArray();
  }
  return users;
}

// 修改用户信息
export async function updateUser({ id, nickName, username, friends, password, valid }) {
  const updateFields = {
    $set: {
      nickName,
      username,
      friends: friends ? friends.map((friend) => safeObjectId(friend)) : undefined,
      password, // 注意：在真实应用中，密码不应该明文存储
      valid,
      updateTime: new Date(),
    },
  };

  // 如果其中的字段有没传入的话，把该字段移除
  Object.keys(updateFields.$set).forEach((key) => {
    if (updateFields.$set[key] === undefined) {
      delete updateFields.$set[key];
    }
  });
    
  const result = await db.collection('users').updateOne({ _id: safeObjectId(id), valid: 1 }, updateFields);
  return result;
}

// 删除用户：后续优化为假删
export async function deleteUser(id) {
  const result = await db.collection('users').deleteOne({ _id: safeObjectId(id) });
  return result;
}

// 查询陌生人（根据陌生人的username）（用户id需要传入判断不是好友）
export async function getStrangerByName(username, userId) {
  const user = await db.collection('users').findOne({ valid: 1, userId });
  const stranger = await db.collection('users').findOne({ valid: 1, _id: { $nin: user.friends }, username });
  
  return stranger;
}

// 获取好友列表
export async function getFriends(userId) {
  const user = await db.collection('users').findOne({ _id: safeObjectId(userId), valid: 1 });
  const friends = await db.collection('users').find({ _id: { $in: user.friends }, valid: 1 }).toArray();
  
  return friends;
}

// 获取申请好友列表
export async function getApplyFriends(userId) {
  const user = await db.collection('users').findOne({ _id: safeObjectId(userId), valid: 1 });
  const applyFriends = await db.collection('users').find({ _id: { $in: user.applyfriends }, valid: 1 }).toArray();
  
  return applyFriends;
}

// 添加好友
export async function addFriend(userId, friendId) {
  // 先判断是否已经是好友
  const user = await db.collection('users').findOne({ _id: safeObjectId(userId), valid: 1 });
  const isFriend = user.friends.includes(safeObjectId(friendId));
  if (isFriend) {
    return { message: '已经是好友' };
  }
  // 再把用户id添加进入被申请人的申请好友列表applyfriends
  const updateField = {
    $addToSet: {
      applyfriends: safeObjectId(userId),
    }
  };
  const result = await db.collection('users').updateOne({ _id: safeObjectId(friendId), valid: 1 }, updateField);
  return result;
}

// 处理好友申请
export async function handleApplyFriend(userId, friendId, handleType) {
  // 加到我的朋友列表里
  const updateMyFriends = {
    $addToSet: {
      friends: safeObjectId(friendId),
    },
  };
  // 从被申请人的申请列表移除，且加入他的朋友列表
  const updateStrangerFriends = {
    $addToSet: {
      friends: safeObjectId(userId),
    },
    $pull: {
      applyfriends: safeObjectId(userId),
    },
  };

  if (handleType === 'accept') {
    updateMyFriends.$addToSet = {
      friends: safeObjectId(friendId),
    };
  }

  const result1 = await db.collection('users').updateOne({ _id: safeObjectId(userId), valid: 1 }, updateMyFriends);
  const result2 = await db.collection('users').updateOne({ _id: safeObjectId(friendId), valid: 1 }, updateStrangerFriends);

  return { result1, result2 };
}

// 删除好友
export async function deleteFriend(userId, friendId) {
  const myUpdate = {
    $pull: {
      friends: safeObjectId(friendId),
    },
  };
  const result1 = await db.collection('users').updateOne({ _id: safeObjectId(userId), valid: 1 }, myUpdate);
  
  const friendUpdate = {
    $pull: {
      friends: safeObjectId(userId),
    },
  };
  const result2 = await db.collection('users').updateOne({ _id: safeObjectId(friendId), valid: 1 }, friendUpdate);
  return { result1, result2 };
}