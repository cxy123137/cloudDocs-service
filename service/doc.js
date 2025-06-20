import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

// 连接到数据库
const { db } = await connectToDatabase();

// 通用的数据库操作辅助函数
async function performDatabaseOperation(operation) {
  try {
    const result = await operation;
    return result;
  } catch (error) {
    console.error('数据库操作错误：', error);
    throw error;
  }
}

// 新增文档
export async function addDocument({title = "未命名文档", baseId, content = {}, version = 0, snapshotAtVersion = null, snapshot = '', valid = 1}) {
  const newDoc = {
    _id: new ObjectId(),
    title,
    baseId: new ObjectId(baseId),
    content,
    version,
    snapshotAtVersion,
    snapshot,
    valid,
    createTime: new Date(),
    updateTime: new Date(),
  };
  const result = await performDatabaseOperation(db.collection('docs').insertOne(newDoc));
  return result;
}

// 查询文档，可以查询一个或者全部
export async function getDocument({ id } = {}) {
  if (id) {
    return await performDatabaseOperation(
      db.collection('docs').findOne({ _id: new ObjectId(id), valid: 1 })
    );
  } else {
    return await performDatabaseOperation(
      db.collection('docs').find({ valid: 1 }).toArray()
    );
  }
}

// 根据 baseId 查询文档
export async function getDocumentByBaseId(baseId) {
  return await performDatabaseOperation(
    db.collection('docs').find({ baseId: new ObjectId(baseId), valid: 1 }).toArray()
  );
}

// 更新文档
export async function updateDocument({ id, title, content }) {
  const documentData = {
    title,
    content,
    updateTime: new Date(),
  };
  const result = await performDatabaseOperation(
    db.collection('docs').updateOne(
      { _id: new ObjectId(id), valid: 1 },
      { $set: documentData }
    )
  );
  return result;
}

// 删除文档
export async function deleteDocument(id) {
  const result = await performDatabaseOperation(
    db.collection('docs').deleteOne({ _id: new ObjectId(id), valid: 1 })
  );
  return result;
}