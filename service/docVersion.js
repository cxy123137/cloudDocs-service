import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import { updateDocument } from './doc.js';

// 连接到数据库
const { db } = await connectToDatabase();

// 新增版本
export async function addDocVersion({ docId, title, baseId, ownerId, content, valid }) {
  // 根据文档ID查询文档（获取版本号）
  const doc = await db.collection('docs').findOne({ _id: new ObjectId(docId), valid: 1 });
  // 保存一次文档，并且更新文档版本号
  await updateDocument({ id: docId, title, baseId, ownerId, content, version: doc.version + 1, valid });
  if (!doc) {
    throw new Error('文档不存在或已删除');
  }
  const newDoc = await db.collection('docs').findOne({ _id: new ObjectId(docId), valid: 1 });
  const newVersion = {
    _id: new ObjectId(),
    rootDocId: newDoc._id,
    version: newDoc.version,
    content: newDoc.content,
    ownerId: newDoc.ownerId,
    createTime: new Date(),
  };
  const result = await db.collection('docVersions').insertOne(newVersion);
  return result;
}

// 查询版本列表，根据版本号倒序
export async function getDocVersions({ docId }) {
  const result = await db.collection('docVersions')
  .find({ rootDocId: new ObjectId(docId) })
  .sort({ version: -1 }).toArray();
  return result;
}

// 查询版本内容
export async function getDocVersionContent({ docVersionId }) {
  const result = await db.collection('docVersions').findOne({ _id: new ObjectId(docVersionId) });
  return result;
}

// 删除版本（真删），版本号不可逆
export async function deleteDocVersion({ docVersionId }) {
  const result = await db.collection('docVersions').deleteOne({ _id: new ObjectId(docVersionId) });
  return result;
}