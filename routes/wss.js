import { WebSocketServer } from 'ws';
import { connectToDatabase } from '../db.js';
import * as Y from 'yjs';

import { createRequire } from 'module';
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
    const docId = parts[2] || 'default';

    // 获取ydoc
    let ydoc = docsMap.get(docId);
    // 如果ydoc不存在则创建
    if (!ydoc) {
      ydoc = new Y.Doc();
      // 加载历史状态
      const doc = await db.collection('docs').findOne({ _id: docId });
      if (doc && doc.ydocState) {
        Y.applyUpdate(ydoc, doc.ydocState);
      }
      // 监听变更，持久化
      ydoc.on('update', async update => {
        const lastUpdatedDoc = await db.collection('docs').findOne({ _id: docId });
        console.log(lastUpdatedDoc);
        console.log(lastUpdatedDoc.updateTime);
        
        
        // 每隔10秒保存一次
        if (Date.now() - lastUpdatedDoc.updateTime.getTime() < 10000) {
          return;
        }
        await db.collection('docs').updateOne(
          { _id: docId },
          { $set: { ydocState: Y.encodeStateAsUpdate(ydoc), updateTime: new Date() } },
          { upsert: true }
        );
      });
      docsMap.set(docId, ydoc);
    }

    // 
    setupWSConnection(conn, req, { roomName: docId, doc: ydoc });
    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}`);
  });
}