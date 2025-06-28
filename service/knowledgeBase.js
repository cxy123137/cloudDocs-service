import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

// 安全的ObjectId转换函数
function safeObjectId(id) {
  console.log('knowledgeBase safeObjectId收到参数:', id, '类型:', typeof id);
  
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

// 创建知识库
export const addKnowledgeBase = async (knowledgeBaseData) => {
const { db } = await connectToDatabase();
  const { name, ownerId, description } = knowledgeBaseData;
  const knowledgeBase = {
    _id: new ObjectId(),
    baseName: name,
    ownerId: safeObjectId(ownerId),
    baseDesc: description,
    valid: 1,
    createTime: new Date(),
    updateTime: new Date()
  };
  return await db.collection('knowledgeBases').insertOne(knowledgeBase);
};

// 根据ID获取知识库
export const getKnowledgeBase = async (id) => {
  const { db } = await connectToDatabase();
  const knowledgeBases = await db.collection('knowledgeBases').findOne({ _id: safeObjectId(id), valid: 1 });
  return knowledgeBases;
};

// 根据用户ID获取知识库列表
export const getKnowledgeBasesByUserId = async (userId) => {
  const { db } = await connectToDatabase();
  
  // 获取用户拥有的所有知识库
  const userKnowledgeBases = await db.collection('knowledgeBases').find(
    { ownerId: safeObjectId(userId), valid: 1 }
  ).toArray();
  
  // 获取用户有权限的知识库
  const permissions = await db.collection('basePermissions').find({ userId: safeObjectId(userId) }).toArray();
  const permissionKnowledgeBases = await db.collection('knowledgeBases').find(
    { _id: { $in: permissions.map(p => p.baseId) }, valid: 1 }
  ).toArray();
  
  // 合并并去重
  const allKnowledgeBases = [...userKnowledgeBases, ...permissionKnowledgeBases];
  const uniqueKnowledgeBases = allKnowledgeBases.filter((kb, index, self) => 
    index === self.findIndex(k => k._id.toString() === kb._id.toString())
  );
  
  return uniqueKnowledgeBases;
};

// 根据用户ID获取默认知识库ID
export const getDefaultKnowledgeBaseIdByUserId = async (userId) => {
  const { db } = await connectToDatabase();
  const defaultKnowledgeBase = await db.collection('knowledgeBases').findOne({ownerId: safeObjectId(userId), valid: 1 });
  return defaultKnowledgeBase ? defaultKnowledgeBase._id : null;
  };

// 更新知识库
export const updateKnowledgeBase = async (id, knowledgeBaseData) => {
  const { db } = await connectToDatabase();
  const { name, description } = knowledgeBaseData;
  const updateData = {
    baseName: name,
    baseDesc: description,
    updateTime: new Date()
  };
  const result = await db.collection('knowledgeBases').updateOne({ _id: safeObjectId(id), valid: 1 }, { $set: updateData });
  return result;
};

// 删除知识库
export const deleteKnowledgeBase = async (id) => {
  const { db } = await connectToDatabase();
  const result = await db.collection('knowledgeBases').deleteOne({ _id: safeObjectId(id), valid: 1 });
  return result;
};
