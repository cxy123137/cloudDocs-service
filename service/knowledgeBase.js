import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

// 添加知识库（单个）
export async function addKnowledgeBase(baseName, baseDesc, ownerId, adminIds = [], readaUserIds = [], editaUserIds = [], docs = []) {
  const { db } = await connectToDatabase();
  const knowledgeBaseData = {
    _id: new ObjectId(),
    baseName,
    baseDesc,
    ownerId: new ObjectId(ownerId),
    adminIds: adminIds.map(id => new ObjectId(id)),
    readaUserIds: readaUserIds.map(id => new ObjectId(id)),
    editaUserIds: editaUserIds.map(id => new ObjectId(id)),
    docs,
    valid: 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };
  const result = await db.collection('knowledgeBases').insertOne(knowledgeBaseData);
  return result;
}

// 根据知识库id，查询知识库信息，只能查询一个或者全部
export async function getKnowledgeBase(id) {
  const { db } = await connectToDatabase();
  let knowledgeBases;
  if (id) {
    knowledgeBases = await db.collection('knowledgeBases').findOne({ _id: new ObjectId(id), valid: 1 });
  } else {
    knowledgeBases = await db.collection('knowledgeBases').find({ valid: 1 }).toArray();
  }
  return knowledgeBases;
}

// 根据用户id查询用户的默认知识库id
export async function getDefaultKnowledgeBaseIdByUserId(userId) {
  const { db } = await connectToDatabase();
  console.log(userId);
  const defaultKnowledgeBase = await db.collection('knowledgeBases').findOne({ownerId: new ObjectId(userId), valid: 1 });
  console.log(defaultKnowledgeBase);
  
  return defaultKnowledgeBase._id;
}

// 登录接口使用，根据ownerId，查询知识库信息，只能查询一个
export async function getKnowledgeBaseByOwnerId(ownerId) {
  const { db } = await connectToDatabase();
  const knowledgeBases = await db.collection('knowledgeBases').findOne({ ownerId: new ObjectId(ownerId), valid: 1 });
  return knowledgeBases;
}

export async function updateKnowledgeBase(id, baseName, baseDesc, adminIds, readaUserIds, editaUserIds, docs, valid) {
  const { db } = await connectToDatabase();
  const knowledgeBaseData = {
    baseName,
    baseDesc,
    adminIds: adminIds ? adminIds.map(id => new ObjectId(id)) : undefined,
    readaUserIds: readaUserIds ? readaUserIds.map(id => new ObjectId(id)) : undefined,
    editaUserIds: editaUserIds ? editaUserIds.map(id => new ObjectId(id)) : undefined,
    docs,
    valid,
    updateTime: new Date(),
  };
  const result = await db.collection('knowledgeBases').updateOne({ _id: new ObjectId(id), valid: 1 }, { $set: knowledgeBaseData });
  return result;
}

// 删除知识库：后续优化为假删
export async function deleteKnowledgeBase(id) {
  const { db } = await connectToDatabase();
  const result = await db.collection('knowledgeBases').deleteOne({ _id: new ObjectId(id), valid: 1 });
  return result;
}
