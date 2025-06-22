import { WebSocketServer } from 'ws';
import { connectToDatabase } from '../db.js';
import { getDocument } from '../service/doc.js'
import * as Y from 'yjs';

import { createRequire } from 'module';
import { ObjectId } from 'mongodb';
const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils.js');
const wsPort = 8001;
const { db } = await connectToDatabase();

// 哈希表维护每个房间的ydoc
const docsMap = new Map();

export async function setupWSServer() {
  const wss = new WebSocketServer({ port: wsPort });

  wss.on('connection', async (conn, req) => {
    
    const parts = req.url.split('/');
    if (parts[1] !== 'onlineEdit') {
      conn.close();
      return;
    }
    const userId = parts[2].toString();
    const docId = parts[3].toString() || 'default';        

    // 获取ydoc
    let ydoc = docsMap.get(docId);      
    
    // 如果ydoc不存在则创建
    if (!ydoc) {
      ydoc = new Y.Doc();
      // 加载历史状态（使用最近访问逻辑更新，使用ws连接查询文档）
      const doc = await getDocument({ docId, userId });    
    //   const doc = await db.collection('docs').findOne({ _id: new ObjectId(docId) });      
      
      if (doc) {
        // 从数据库的binary转化为Uint8Array给ydoc所需
        Y.applyUpdate(ydoc, new Uint8Array(doc.ydocState.buffer));
      }

      // 监听变更，持久化
      ydoc.on('update', async update => {
        console.log(111);
        
    // 这里不要用写好的方法查询，不是用户主动行为，否则调用原有方法会导致最近访问被更新
        const lastUpdatedDoc = await db.collection('docs').findOne({ _id: docId });
       
      // 每隔10秒保存一次
        if (Date.now() - lastUpdatedDoc.updateTime.getTime() < 10000) {
          // console.log(111);
          
          return;
        }
        
        await db.collection('docs').updateOne(
          { _id: docId },
          { $set: { ydocState: new Binary(Y.encodeStateAsUpdate(ydoc)), updateTime: new Date() } },
          { upsert: true }
        );
      });

      docsMap.set(docId, ydoc);
    }

    

    // 开启链接
    setupWSConnection(conn, req, { roomName: docId, doc: ydoc });
    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}/${docId}`);
  });
}