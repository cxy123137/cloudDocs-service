import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 增添/授予好友文档权限，permission: 0为管理   1为可写   2为可读
export async function addFriendDocPermission(userId, docId, permissionCode) {
  const result = await db.collection('docPermissions').insertOne(
    {  docId: ObjectId(docId), userId: ObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友文档权限
export async function deleteFriendDocPermission(friendId, docId) {
  const result = await db.collection('docPermissions').deleteOne(
    { userId: ObjectId(friendId), docId: ObjectId(docId) }
  );
  return result;
}

// 修改好友文档权限
export async function updateFriendDocPermission({ friendId, docId, permissionCode }) {
  const result = await db.collection('docPermissions').updateOne(
    { userId: ObjectId(friendId), docId: ObjectId(docId) },
    { $set: { permissionCode: permissionCode } }
  );
  return result;
}

// 获取文档的权限用户列表
export async function getDocPermissions(docId) {
  const result = await db.collection('docPermissions').find({ docId: ObjectId(docId) }).sort({ permissionCode: 1 }).toArray();
  return result;
}

// 知识库权限相关
// 增添/授予好友知识库权限，permission: 1为管理   2为可写   3为可读
export async function addFriendBasePermission(userId, baseId, permissionCode) {
  const result = await db.collection('basePermissions').insertOne(
    { baseId: ObjectId(baseId), userId: ObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友知识库权限
export async function deleteFriendBasePermission(friendId, baseId) {
  const result = await db.collection('basePermissions').deleteOne(
    { userId: ObjectId(friendId), baseId: ObjectId(baseId) }
  );
  return result;
}

// 修改好友知识库权限
export async function updateFriendBasePermission({ friendId, baseId, permissionCode }) {
  const result = await db.collection('basePermissions').updateOne(
    { userId: ObjectId(friendId), baseId: ObjectId(baseId) },
    { $set: { permissionCode: permissionCode } }
  );
  return result;
}

// 获取知识库的权限用户列表
export async function getKnowledgePermissions(baseId) {
  const result = await db.collection('basePermissions').find({ baseId: ObjectId(baseId) }).sort({ permissionCode: 1 }).toArray();
  return result;
}



// 获取知识库权限码
export async function getBasePermissionCode(baseId, userId) {
  const base = await db.collection('knowledgeBases').findOne({ _id: ObjectId(baseId) });
  if (base.ownerId === ObjectId(userId)) {
    return 0;
  }
  const result = await db.collection('basePermissions').findOne({ baseId: ObjectId(baseId), userId: ObjectId(userId) });
  return result.permissionCode;
}

// 获取文档权限码
export async function getDocPermissionCode(docId, userId) {
  // 先获取用户对文档所属知识库的权限
  const baseId = await db.collection('docs').findOne({ _id: ObjectId(docId) }).baseId;
  let permissionCode = getBasePermissionCode(baseId, userId);
  if (permissionCode === '0') {
    return 0;
  }

  // 不是最高权限，继续判断比较
  const doc = await db.collection('docs').findOne({ _id: ObjectId(docId) });
  if (doc.ownerId === ObjectId(userId)) {
    return 0;
  }
  const result = await db.collection('docPermissions').findOne({ docId: ObjectId(docId), userId: ObjectId(userId) });
  return result.permissionCode < permissionCode ? result.permissionCode : permissionCode;
}




