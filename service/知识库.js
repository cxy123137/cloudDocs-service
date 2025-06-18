import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

export async function addKnowledgeBase(req) {
  const knowledgeBaseData = {
    _id: new ObjectId(),
    ownerId: new ObjectId(req.body.ownerId),
    adminIds: (req.body.adminIds || []).map(id => new ObjectId(id)),
    readaUserIds: (req.body.readaUserIds || []).map(id => new ObjectId(id)),
    editaUserIds: (req.body.editaUserIds || []).map(id => new ObjectId(id)),
    docs: req.body.docs || [],
    valid: req.body.valid || 1, // 默认为1，表示有效
    createTime: new Date(),
    updateTime: new Date(),
  };
  console.log(ownerId);
  const result = await db.collection('knowledgeBases').insertOne(knowledgeBaseData);
  return result;
}

// 只能查询一个或者全部
export async function getKnowledgeBase(req) {
  let knowledgeBases;
  if (req.query.id) {
    knowledgeBases = await db.collection('knowledgeBases').findOne({_id: new ObjectId(req.query.id), valid: 1});
  } else {
    knowledgeBases = await db.collection('knowledgeBases').find({valid: 1}).toArray();
  }
  return knowledgeBases;
}

export async function updateKnowledgeBase(req) {
  const knowledgeBaseData = {
    adminIds: (req.body.adminIds || []).map(id => new ObjectId(id)),
    readaUserIds: (req.body.readaUserIds || []).map(id => new ObjectId(id)),
    editaUserIds: (req.body.editaUserIds || []).map(id => new ObjectId(id)),
    docs: req.body.docs,
    valid: req.body.valid,
    updateTime: new Date(),
  };
  const result = await db.collection('knowledgeBases').updateOne({_id: new ObjectId(req.params.id)}, { $set: knowledgeBaseData });
  return result;
}

// 删除知识库：后续优化为假删
export async function deleteKnowledgeBase(req) {
  const result = await db.collection('knowledgeBases').deleteOne({_id: new ObjectId(req.params.id)});
  return result;
}
