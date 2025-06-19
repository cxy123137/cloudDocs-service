import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

// 连接到数据库
const { db } = await connectToDatabase();

// 生成新的 ObjectId
function generateObjectId(id) {
  if (id) {
    return new ObjectId(id);
  }
  return new ObjectId();
}

// 通用的数据库操作辅助函数
async function performDatabaseOperation(operation) {
  try {
    const result = await operation;
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}

// 新增文档
export async function addDocument(title = "未命名文档", baseId, content = {}, 
  version = 0, snapshotAtVersion = null, snapshot = '', valid = 1,) {
  const newDoc = {
    _id: generateObjectId(),
    title,
    baseId: generateObjectId(baseId),
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

// 查询文档
export async function getDocument({ id } = {}) {
  if (id) {
    return await performDatabaseOperation(
      db.collection('docs').findOne({ _id: generateObjectId(id), valid: 1 })
    );
  } else {
    return await performDatabaseOperation(
      db.collection('docs').find({ valid: 1 }).toArray()
    );
  }
}

// 更新文档
export async function updateDocument({
  id,
  content = {},
  valid = 1,
}) {
  const documentData = {
    content,
    valid,
    updateTime: new Date(),
  };
  const result = await performDatabaseOperation(
    db.collection('docs').updateOne(
      { _id: generateObjectId(id), valid: 1 },
      { $set: documentData }
    )
  );
  return result;
}

// 删除文档
export async function deleteDocument(id) {
  const result = await performDatabaseOperation(
    db.collection('docs').deleteOne({ _id: generateObjectId(id), valid: 1 })
  );
  return result;
}