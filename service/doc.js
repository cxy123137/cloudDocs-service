import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 新增和保存文档，都是新生成一个文档快照版本，两个接口都调用这个方法
export async function addDocument(req) {
  const newDoc = {
    id: new ObjectId(),
    title: req.body.title || "未命名文档",
    baseId: req.body.baseId,
    content: req.body.content || {},
    version: req.body.version || 0,
    snapshotAtVersion: req.body.snapshotAtVersion || null,
    snapshot: req.body.snapshot || '',
    valid: req.body.valid || 1,
    createTime: new Date(),
    updateTime: new Date(),
  };
  const result = await db.collection('docs').insertOne(newDoc);
  return result;
}

export async function getDocument(req) {
  let documents;
  if (req.query.id) {
    documents = await db.collection('docs').findOne({_id: new ObjectId(req.query.id), valid: 1});
  } else {
    documents = await db.collection('docs').find({valid: 1}).toArray();
  }
  return documents;
}

// 修订历史版本使用
export async function updateDocument(req) {
  const documentData = {
    // title: req.body.title || "未命名文档",   // 如果可以修改，无从得知是不是这个文档？因为是页面唯一标识
    // baseId: req.body.baseId,                // 绝对不允许修改
    content: req.body.content || {},
    // version: req.body.version || 0,          // 绝对不允许修改
    // snapshotAtVersion: req.body.snapshotAtVersion || null,   // 绝对不允许修改
    // snapshot: req.body.snapshot || '',        // 绝对不允许修改
    valid: req.body.valid || 1,         // 删除使用
    updateTime: new Date(),
  };
  const result = await db.collection('docs').updateOne({_id: new ObjectId(req.body._id), valid: 1}, {$set: documentData});
  return result;
}

export async function deleteDocument(req) {
  const result = await db.collection('docs').deleteOne({_id: new ObjectId(req.body._id), valid: 1});
  return result;
}