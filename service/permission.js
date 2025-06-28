import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 安全的ObjectId转换函数
function safeObjectId(id) {
  console.log('permission safeObjectId收到参数:', id, '类型:', typeof id);
  
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

// 增添/授予好友文档权限，permission: 0为管理   1为可写   2为可读
export async function addFriendDocPermission(userId, docId, permissionCode) {
  const result = await db.collection('docPermissions').insertOne(
    {  docId: safeObjectId(docId), userId: safeObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友文档权限
export async function deleteFriendDocPermission(friendId, docId) {
  const result = await db.collection('docPermissions').deleteOne(
    { userId: safeObjectId(friendId), docId: safeObjectId(docId) }
  );
  return result;
}

// 修改好友文档权限
export async function updateFriendDocPermission({ friendId, docId, permissionCode }) {
  const result = await db.collection('docPermissions').updateOne(
    { userId: safeObjectId(friendId), docId: safeObjectId(docId) },
    { $set: { permissionCode: permissionCode } }
  );
  return result;
}

// 获取文档的权限用户列表
export async function getDocPermissions(docId) {
  const result = await db.collection('docPermissions').find({ docId: safeObjectId(docId) }).sort({ permissionCode: 1 }).toArray();
  return result;
}

// 知识库权限相关
// 增添/授予好友知识库权限，permission: 1为管理   2为可写   3为可读
export async function addFriendBasePermission(userId, baseId, permissionCode) {
  const result = await db.collection('basePermissions').insertOne(
    { baseId: safeObjectId(baseId), userId: safeObjectId(userId), permissionCode: permissionCode }
  );
  return result;
}

// 删除好友知识库权限
export async function deleteFriendBasePermission(friendId, baseId) {
  const result = await db.collection('basePermissions').deleteOne(
    { userId: safeObjectId(friendId), baseId: safeObjectId(baseId) }
  );
  return result;
}

// 修改好友知识库权限
export async function updateFriendBasePermission({ friendId, baseId, permissionCode }) {
  const result = await db.collection('basePermissions').updateOne(
    { userId: safeObjectId(friendId), baseId: safeObjectId(baseId) },
    { $set: { permissionCode: permissionCode } }
  );
  return result;
}

// 获取知识库的权限用户列表
export async function getKnowledgePermissions(baseId) {
  const result = await db.collection('basePermissions').find({ baseId: safeObjectId(baseId) }).sort({ permissionCode: 1 }).toArray();
  return result;
}

// 获取知识库权限码
export async function getBasePermissionCode(baseId, userId) {
  try {
    if (!baseId || !userId) {
      console.log('getBasePermissionCode: 缺少必要参数', { baseId, userId });
      return null;
    }

    const base = await db.collection('knowledgeBases').findOne({ _id: safeObjectId(baseId) });
    if (!base) {
      console.log(`知识库 ${baseId} 不存在`);
      return null;
    }

    // 如果是知识库所有者，返回最高权限
    if (base.ownerId.toString() === userId) {
      return 0;
    }

    // 查找用户对知识库的权限
    const result = await db.collection('basePermissions').findOne({ 
      baseId: safeObjectId(baseId), 
      userId: safeObjectId(userId) 
    });
    
    return result ? result.permissionCode : null;
  } catch (error) {
    console.error(`获取知识库权限码失败:`, error);
    return null;
  }
}

// 获取文档权限码
export async function getDocPermissionCode(docId, userId) {
  try {
    // 先获取文档信息
    const doc = await db.collection('docs').findOne({ _id: safeObjectId(docId) });
    if (!doc) {
      console.log(`文档 ${docId} 不存在`);
      return null;
    }

    // 检查文档所有者
    if (doc.ownerId.toString() === userId) {
      return 0;
    }

    // 获取用户对文档所属知识库的权限
    const baseId = doc.baseId;
    if (!baseId) {
      console.log(`文档 ${docId} 缺少知识库ID`);
      return null;
    }

    let permissionCode = await getBasePermissionCode(baseId, userId);
    if (permissionCode === 0) {
      return 0;
    }

    // 检查文档特定权限
    const docPermission = await db.collection('docPermissions').findOne({ 
      docId: safeObjectId(docId), 
      userId: safeObjectId(userId) 
    });
    
    if (docPermission) {
      return docPermission.permissionCode < permissionCode ? docPermission.permissionCode : permissionCode;
    }
    
    return permissionCode;
  } catch (error) {
    console.error(`获取文档权限码失败:`, error);
    return null;
  }
}




