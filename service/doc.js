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
export async function addDocument({title = "未命名文档", baseId, rootDocId = null,
      ownerId, content = {}, adminIds = [], readaUserIds = [], editaUserIds = [], valid = 1}) {
  const newDoc = {
    _id: new ObjectId(),
    title,
    baseId: new ObjectId(baseId),
    rootDocId,
    ownerId,
    content,
    adminIds: adminIds.map(id => new ObjectId(id)),
    readaUserIds: readaUserIds.map(id => new ObjectId(id)),
    editaUserIds: editaUserIds.map(id => new ObjectId(id)),
    valid,
    recentlyOpen: [],
    createTime: new Date(),
    updateTime: new Date(),
  };
  const result = await performDatabaseOperation(db.collection('docs').insertOne(newDoc));
  return result;
}

// 访问文档（配访客记录功能）
export async function getDocument({ docId, userId }) {
  // 每次访问文档时，更新最近访问时间 & 最近访问用户
  // 1. 查询该用户是否已在 recentlyOpen 数组中：如果有，更新访问时间，否则 push 新记录
  const doc = await db.collection('docs').findOne({
    _id: new ObjectId(docId),
    valid: 1,
    'recentlyOpen.recentlyOpenUserId': new ObjectId(userId)
  });

  if (doc) {
    // 用户已存在，更新访问时间
    await db.collection('docs').updateOne(
      {
        _id: new ObjectId(docId),
        valid: 1,
        'recentlyOpen.recentlyOpenUserId': new ObjectId(userId)
      },
      {
        $set: { 'recentlyOpen.$.recentlyOpenTime': new Date() }
      }
    );
  } else {
    // 用户不存在访问记录，push 新记录
    await db.collection('docs').updateOne(
      { _id: new ObjectId(docId), valid: 1 },
      {
        $push: {
          recentlyOpen: {
            recentlyOpenUserId: new ObjectId(userId),
            recentlyOpenTime: new Date()
          }
        }
      }
    );
  }

  // 懒删除，更改完最近访问用户的信息后，检查内部是否有过期的访客记录，并删除
  await db.collection('docs').updateOne(
    { 
      _id: new ObjectId(docId),
      valid: 1,
    },
    {
      $pull: {
        recentlyOpen: {
          // 3 天前的记录视为过期
          recentlyOpenTime: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          // 测试，十秒过期
          // recentlyOpenTime: { $lt: new Date(Date.now() - 10000) }
        }
      }
    }
  );

  // 查询文档
  return await performDatabaseOperation(
    db.collection('docs').findOne({ _id: new ObjectId(docId), valid: 1 })
  );
}

// 查询最近访问文档，根据用户id是否存在于访客列表，查询出所有文档
// 同时连表查询，前端需要渲染的 文档归属人昵称 & 归属知识库名称
export async function getDocumentByRecentlyUserId({ userId }) {
  return await performDatabaseOperation(
    db.collection('docs').aggregate([
      {
        $match: {
          "recentlyOpen.recentlyOpenUserId": new ObjectId(userId),
          valid: 1
        }
      },
      {
        $lookup: {
        from: "users",                // 关联的目标集合
        localField: "ownerId",        // 当前集合的关联字段
        foreignField: "_id",          // 目标集合的关联字段
        as: "userInfo"                // 结果放入的字段名
        }
      },
      {
        // $unwind: "$userInfo"   // 将数组形式的 userInfo 拆解为对象
        $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
        "nikeName": "$userInfo.nikeName",   // 提取用户nikeName
        }
      },
      {
        $project: {
          "userInfo": 0  // 移除整个 userInfo 对象，只保留nikeName
        }
      },
      {
        $lookup: {
          from: "knowledgeBases",
          localField: "baseId",
          foreignField: "_id",
          as: "baseInfo"
        }
      },
      {
        $unwind: { path: "$baseInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          "baseName": "$baseInfo.baseName",
        }
      },
      {
        $project: {
          "baseInfo": 0
        }
      }
    ]).toArray()
  );
}

// 根据 baseId 查询文档
export async function getDocumentByBaseId({ baseId }) {
  return await performDatabaseOperation(
    db.collection('docs').find({ baseId: new ObjectId(baseId), valid: 1 }).toArray()
  );
}

// 更新文档
export async function updateDocument({ id, title, baseId, rootDocId, content,
      adminIds, readaUserIds, editaUserIds, valid }) {
  const documentData = {
    title,
    baseId: new ObjectId(baseId),
    rootDocId,
    content,
    adminIds: adminIds ? adminIds.map(id => new ObjectId(id)) : undefined,
    readaUserIds: readaUserIds ? readaUserIds.map(id => new ObjectId(id)) : undefined,
    editaUserIds: editaUserIds ? editaUserIds.map(id => new ObjectId(id)) : undefined,
    valid,
    updateTime: new Date(),
  };

  // 如果有传入的字段为 undefined，则不更新该字段
  Object.keys(documentData).forEach((key) => {
    if (documentData[key] === undefined) {
      delete documentData[key];
    }
  });

  const result = await db.collection('docs').updateOne(
      { _id: new ObjectId(id), valid: 1 },
      { $set: documentData }
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