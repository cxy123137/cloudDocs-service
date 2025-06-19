import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

const { db } = await connectToDatabase();

// 新增和保存文档，都是新生成一个文档快照版本，两个接口都调用这个方法
export async function addDocument(req) {
  const newDoc = {
    _id: new ObjectId(),
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
  return await performDatabaseOperation(db.collection('docs').insertOne(newDoc));
}

export async function getDocument(req) {
  let documents;
  if (req.query.id) {
    documents = await db.collection('docs').findOne({_id: new ObjectId(req.query.id), valid: 1});
  } else {
    documents = await db.collection('docs').find({valid: 1}).toArray();
  }
  return await performDatabaseOperation(documents);
}

// 修订历史版本使用
export async function updateDocument(req) {
  const documentData = {
    content: req.body.content || {},
    valid: req.body.valid || 1,         // 删除使用
    updateTime: new Date(),
  };
  const result = await db.collection('docs').updateOne({_id: new ObjectId(req.body._id), valid: 1}, {$set: documentData});
  return await performDatabaseOperation(result);
}

export async function deleteDocument(req) {
  const result = await db.collection('docs').deleteOne({_id: new ObjectId(req.body._id), valid: 1});
  return await performDatabaseOperation(result);
}

// 通用的数据库操作辅助函数
async function performDatabaseOperation(operation) {
  try {
    const result = await operation;
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error; // 抛出错误以便调用者可以适当地处理它
  }
}
