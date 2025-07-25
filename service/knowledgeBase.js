import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 添加知识库（单个）
export async function addKnowledgeBase(baseName, baseDesc, ownerId) {
  const knowledgeBaseData = {
    _id: new ObjectId(),
    baseName,
    baseDesc,
    ownerId: new ObjectId(ownerId),
    valid: 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };
  const result = await db.collection('knowledgeBases').insertOne(knowledgeBaseData);
  return result;
}

// 根据知识库id，查询知识库信息，只能查询一个或者全部
export async function getKnowledgeBase(id) {
  let knowledgeBases;
  if (id) {
    knowledgeBases = await db.collection('knowledgeBases').findOne({ _id: new ObjectId(id), valid: 1 });
  } else {
    knowledgeBases = await db.collection('knowledgeBases').find({ valid: 1 }).toArray();
  }
  return knowledgeBases;
}

// 登录接口使用，根据用户id查询用户的默认知识库id
export async function getDefaultKnowledgeBaseIdByUserId(userId) {
  const defaultKnowledgeBase = await db.collection('knowledgeBases').findOne({ownerId: new ObjectId(userId), valid: 1 });
  
  return defaultKnowledgeBase._id;
}

// 改成，根据userId，查询用户名下的所有知识库，并查询所有有权限的知识库
export async function getKnowledgeBaseByUserId(userId) {
  const permissions = await db.collection('permissions').find({ userId: new ObjectId(userId) }).toArray();
  // const knowledgeBases = await db.collection('knowledgeBases').find({
  //   $or: [
  //     { ownerId: new ObjectId(userId) },
  //     { _id: { $in: permissions.map(permission => permission.baseId) } }
  //   ],
  //   valid: 1
  // }).toArray();
  // 添加连表查询知识库下的文档数组字段
  const knowledgeBases = await db.collection('knowledgeBases').aggregate([
  {
    $match: {
      $or: [
        { ownerId: new ObjectId(userId) },
        { _id: { $in: permissions.map(permission => new ObjectId(permission.baseId)) } }
      ],
      valid: 1
    }
  },
  {
    $lookup: {
      from: 'docs', // 连接的表名
      localField: '_id', // 当前集合中用于匹配的字段
      foreignField: 'baseId', // 外部集合中用于匹配的字段
      as: 'docs' // 结果字段名
    }
  }
  ]).toArray();

  return knowledgeBases;
}

// 编辑知识库
export async function updateKnowledgeBase(id, baseName, baseDesc, valid) {
  const knowledgeBaseData = {
    baseName,
    baseDesc,
    valid,
    updateTime: new Date(),
  };

  // 如果没有其中的字段有没传入的话，把该字段移除
  Object.keys(knowledgeBaseData).forEach(key => {
    if (knowledgeBaseData[key] === undefined) {
      delete knowledgeBaseData[key];
    }
  });

  const result = await db.collection('knowledgeBases').updateOne({ _id: new ObjectId(id), valid: 1 }, { $set: knowledgeBaseData });
  return result;
}

// 删除知识库：后续优化为假删
export async function deleteKnowledgeBase(id) {
  // 不能删除默认知识库
  const knowledgeBase = await db.collection('knowledgeBases').findOne({ _id: new ObjectId(id), valid: 1 });
  const userId = knowledgeBase.ownerId;
  const defaultKnowledgeBaseId = await getDefaultKnowledgeBaseIdByUserId(userId);
  if (id == defaultKnowledgeBaseId) return 402;
  // 同时删除名下所有文档
  await db.collection('docs').deleteMany({ baseId: new ObjectId(id) });
  const result = await db.collection('knowledgeBases').deleteOne({ _id: new ObjectId(id), valid: 1 });
  return result;
}
