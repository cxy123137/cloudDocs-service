import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 授予好友文档权限，permission: 1为管理   2为可写   3为可读
export async function addFriendDocPermission(userId, docId, permissionCode) {
  // 先判断是否已经有权限，如果有则直接更新
  const permission = await db.collection('docPermissions').findOne({ userId: new ObjectId(userId), docId: new ObjectId(docId) });
  if (permission) {
    return updateFriendDocPermission({ friendId: userId, docId, permissionCode });
  }

  
  const result = await db.collection('docPermissions').insertOne(
    {  docId: new ObjectId(docId), userId: new ObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友文档权限
export async function deleteFriendDocPermission(friendId, docId) {
  const result = await db.collection('docPermissions').deleteOne(
    { userId: new ObjectId(friendId), docId: new ObjectId(docId) }
  );
  return result;
}

// 修改好友文档权限
export async function updateFriendDocPermission({ friendId, docId, newPermissionCode }) {
  const result = await db.collection('docPermissions').updateOne(
    { userId: new ObjectId(friendId), docId: new ObjectId(docId) },
    { $set: { permissionCode: newPermissionCode } }
  );
  return result;
}

// 获取文档的权限用户列表
export async function getDocPermissions(docId) {
  // 获取权限用户列表，并且连表查询用户表的用户nickName
  
  const result = await db.collection('docPermissions').aggregate([
    { $match: { docId: new ObjectId(docId) } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    {
      // 转成对象，提取字段nickName
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
    },
    { $addFields: {
        "nickName": "$user.nickName"
      }
    },
    { $project: { user: 0 } },
    { $sort: { permissionCode: 1 } }
  ]).toArray();
  return result;
}

// 知识库权限相关
// 修改/授予好友知识库权限，permission: 1为管理   2为可写   3为可读
export async function addFriendBasePermission(userId, baseId, permissionCode) {
  const permission = await db.collection('basePermissions').findOne({ userId: new ObjectId(userId), baseId: new ObjectId(baseId) });
  if (permission) {
    return updateFriendBasePermission({ friendId: userId, baseId, newPermissionCode: permissionCode });
  }
  const result = await db.collection('basePermissions').insertOne(
    { baseId: new ObjectId(baseId), userId: new ObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友知识库权限
export async function deleteFriendBasePermission(friendId, baseId) {
  const result = await db.collection('basePermissions').deleteOne(
    { userId: new ObjectId(friendId), baseId: new ObjectId(baseId) }
  );
  return result;
}

// 修改好友知识库权限
export async function updateFriendBasePermission({ friendId, baseId, newPermissionCode }) {
  const result = await db.collection('basePermissions').updateOne(
    { userId: new ObjectId(friendId), baseId: new ObjectId(baseId) },
    { $set: { permissionCode: newPermissionCode } }
  );
  return result;
}

// 获取知识库的权限用户列表
export async function getKnowledgePermissions(baseId) {
  // 获取权限用户列表，并且连表查询用户表的用户nickName
  const result = await db.collection('basePermissions').aggregate([
    { $match: { baseId: new ObjectId(baseId) } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    {
      // 转成对象，提取字段nickName
        $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true }
    },
    { $addFields: {
        "nikeName": "$user.nikeName",
        }
    },
    { $project: { user: 0 } },
    { $sort: { permissionCode: 1 } }
  ]).toArray();
  return result;
}



// 获取知识库权限码
export async function getBasePermissionCode(baseId, userId) {
  const base = await db.collection('knowledgeBases').findOne({ _id: new ObjectId(baseId) });
  
  if (base.ownerId.equals(new ObjectId(userId))) {
    return 0;
  }
  const result = await db.collection('basePermissions').findOne({ baseId: new ObjectId(baseId), userId: new ObjectId(userId) });
  if (result == null) return null;
  return result.permissionCode;
}

// 获取文档权限码
export async function getDocPermissionCode(docId, userId) {
  // 先获取用户对文档所属知识库的权限
  const doc1 = await db.collection('docs').findOne({ _id: new ObjectId(docId) });
  const baseId = doc1.baseId;
  

  let permissionCode = getBasePermissionCode(baseId, userId);
  if (permissionCode === '0') {
    return 0;
  }

  // 不是最高权限，继续判断比较
  const doc = await db.collection('docs').findOne({ _id: new ObjectId(docId) });
  
  if (doc.ownerId.equals(new ObjectId(userId))) {
    return 0;
  }
  const result = await db.collection('docPermissions').findOne({ docId: new ObjectId(docId), userId: new  ObjectId(userId) });
  return result.permissionCode < permissionCode ? result.permissionCode : permissionCode;
}