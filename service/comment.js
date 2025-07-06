import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

// 连接到数据库
const { db } = await connectToDatabase();

// 新增评论
export async function addComment({ docId, userId, content }) {
  const result = await db.collection('comments').insertOne({
    _id: new ObjectId(),
    docId: new ObjectId(docId),
    userId: new ObjectId(userId),
    content,
    createTime: new Date(),
    updateTime: new Date(),
  });
  return result.insertedId;
}

// 根据文档id获取评论列表
export async function getCommentsByDocId(docId) {
  // 获取评论同时，连表查询users表，获取用户的nickName
  const comments = await db.collection('comments').aggregate([
    { $match: { docId: new ObjectId(docId) } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $addFields: { 'nickName': '$user.nickName' } },
    { $project: { "user": 0 } }
  ]).toArray();
  console.log(comments);
  console.log(docId);
  
  
  return comments;
}

// 根据评论id获取评论详情（好像暂时不需要）
export async function getCommentById(commentId) {
  const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });
  return comment;
}

// 修改评论
export async function updateComment(commentId, content) {
  const update = {
    content,
    updateTime: new Date()
  }
  const result = await db.collection('comments').updateOne(
    { _id: new ObjectId(commentId) },
    { $set: update }
  );
  return result.modifiedCount;
}

// 删除评论
export async function deleteComment(commentId) {
  const result = await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });
  return result.deletedCount;
}

// 删除文档对应的所有评论
export async function deleteCommentsByDocId(docId) {
  const result = await db.collection('comments').deleteMany({ docId: new ObjectId(docId) });
  return result.deletedCount;
}

// 保存映射表
export async function saveMapping({ docId, map }) {
  // 查询文档是否有旧的映射数据
  const oldMapping = await db.collection('CommentTextStyleMap').findOne({ docId: new ObjectId(docId) });
  if (oldMapping) {
    // 如果有，则更新映射数据
    const result = await db.collection('CommentTextStyleMap').updateOne(
      { _id: oldMapping._id },
      { $set: {docId: new ObjectId(docId), map, updateTime: new Date() } }
    );
    return result.modifiedCount;
  } else {
    // 如果没有，则新增映射数据
    const result = await db.collection('CommentTextStyleMap').insertOne({
      _id: new ObjectId(),
      docId: new ObjectId(docId),
      map,
      createTime: new Date(),
      updateTime: new Date(),
    });
    return result.insertedId;
  }
}

// 获取映射表
export async function getMappingByDocId(docId) {
  const mapping = await db.collection('CommentTextStyleMap').findOne({ docId: new ObjectId(docId) });
  return mapping.map;
}

