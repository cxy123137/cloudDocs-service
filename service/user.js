import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import { addKnowledgeBase } from './knowledgeBase.js';

const { db } = await connectToDatabase();

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
  const base = await addKnowledgeBase('我的知识库', '我的知识库', _id.toString()); // 默认添加一个知识库
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
export async function updateUser({ id, nickName, username, friends, password, valid }) {
  const updateFields = {
    $set: {
      nickName,
      username,
      friends: friends ? friends.map((friend) => new ObjectId(friend)) : undefined,
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
    
  const result = await db.collection('users').updateOne({ _id: new ObjectId(id), valid: 1 }, updateFields);
  return result;
}

// 删除用户：后续优化为假删
export async function deleteUser(id) {
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  return result;
}

// 查询陌生人（根据陌生人的username）（用户id需要传入判断不是好友）
export async function getStrangerByName(username, userId) {
  const user = await db.collection('users').findOne({ valid: 1, _id: new ObjectId(userId) });
  console.log(userId);
  
  console.log(user);
  console.log(user.friends);
  
  
  const stranger = await db.collection('users').findOne({ valid: 1, _id: { $nin: user.friends }, username });
  
  return stranger;
}

// 获取好友列表
export async function getFriends(userId) {
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId), valid: 1 });
  const friends = await db.collection('users').find({ _id: { $in: user.friends }, valid: 1 }).toArray();
  
  return friends;
}

// 获取申请好友列表
export async function getApplyFriends(userId) {
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId), valid: 1 });
  const applyFriends = await db.collection('users').find({ _id: { $in: user.applyfriends }, valid: 1 }).toArray();
  
  return applyFriends;
}

// 添加好友
export async function addFriend(userId, friendId) {
  // 先判断是否已经是好友
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId), valid: 1 });
  const isFriend = user.friends.includes(new ObjectId(friendId));
  if (isFriend) {
    return { message: '已经是好友' };
  }
  // 再把用户id添加进入被申请人的申请好友列表applyfriends
  const updateField = {
    $addToSet: {
      applyfriends: new ObjectId(userId),
    }
  };
  const result = await db.collection('users').updateOne({ _id: new ObjectId(friendId), valid: 1 }, updateField);
  return result;
}

// 用户同意好友申请
export async function handleApplyFriend(userId, friendId) {
  // 把申请人加到我的朋友列表里，从我的申请列表移除
  const updateMyFriends = {
    $addToSet: {
      friends: new ObjectId(friendId),
    },
    $pull: {
      applyfriends: new ObjectId(friendId),
    }
  };
  // 将我加入他的朋友列表
  const updateStrangerFriends = {
    $addToSet: {
      friends: new ObjectId(userId),
    }
  };

  const result1 = await db.collection('users').updateOne({ _id: new ObjectId(userId), valid: 1 }, updateMyFriends);
  const result2 = await db.collection('users').updateOne({ _id: new ObjectId(friendId), valid: 1 }, updateStrangerFriends);

  return { result1, result2 };
}

// 拒绝好友申请
export async function refuseApplyFriend(userId, friendId) {
  // 将申请人从我的申请列表移除
  const updateField = {
    $pull: {
      applyfriends: new ObjectId(friendId),
    }
  };
  const result = await db.collection('users').updateOne({ _id: new ObjectId(userId), valid: 1 }, updateField);
  return result;
}

// 删除好友
export async function deleteFriend(userId, friendId) {
  const myUpdate = {
    $pull: {
      friends: new ObjectId(friendId),
    },
  };
  const result1 = await db.collection('users').updateOne({ _id: new ObjectId(userId), valid: 1 }, myUpdate);

  const friendUpdate = {
    $pull: {
      friends: new ObjectId(userId),
    },
  };
  const result2 = await db.collection('users').updateOne({ _id: new ObjectId(friendId), valid: 1 }, friendUpdate);
  return { result1, result2 };
}