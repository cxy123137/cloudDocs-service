import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils.js';
import { WebSocketServer } from 'ws';
import { connectToDatabase } from './db.js';
import * as Y from 'yjs';

const wss = new WebSocketServer({ port: 1234 });
const { db } = await connectToDatabase();
const wsPort = 8001;

// ws协同编辑文本内容（仅文本，文本和标题分开存储）
export async function setupWSServer() {
  setPersistence({
    bindState: async (docId, ydoc) => {
      // 初始化时加载 MongoDB 里的状态
      const doc = await db.collection('docs').findOne({ _id: docId });
      if (doc && doc.ydocState) {
        Y.applyUpdate(ydoc, doc.ydocState);
      }
      // 编辑时监听，自动保存
      ydoc.on('update', async update => {
        // 每10s保存一次状态
        const lastUpdatedDoc = await db.collection('docs').findOne({ _id: docId });
        if (Date.now() - lastUpdatedDoc.updateTime.getTime() < 10000) {
            return;
        }

        await db.collection('docs').updateOne(
          { _id: docId },
          { $set: { ydocState: Y.encodeStateAsUpdate(ydoc), updateTime: new Date() } },
        );
      });
    },
    writeState: async (docId, ydoc) => {
      // 关闭文档时做一次最终保存
      await db.collection('docs').updateOne(
        { _id: docId },
        { $set: { ydocState: Y.encodeStateAsUpdate(ydoc), updateTime: new Date() } },
      );
    }
  });

  // ws服务启动
  wss.on('connection', (conn, req) => {
    const parts = req.url.split('/');
    if (parts[1] !== 'onlineEdit') {
      conn.close();
      return;
    }
    const docId = parts[2] || 'default'; // 提取url中的文档Id作为房间号roomname
    setupWSConnection(conn, req, { docId });
    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}`);
  });
}