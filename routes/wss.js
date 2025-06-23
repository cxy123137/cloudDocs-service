import { WebSocketServer } from 'ws';
import { connectToDatabase } from '../db.js';
import { getDocument } from '../service/doc.js';
import { Binary } from 'mongodb';
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
  const wss = new WebSocketServer({ port: wsPort,  maxPayload: 10 * 1024 * 1024, perMessageDeflate: false })

  wss.on('connection', async (conn, req) => {
    const parts = req.url.split('/');
    if (parts[1] !== 'onlineEdit') {
      conn.close();
      return;
    }

    const userId = parts[2].toString();
    const docId = parts[3].toString().split('?')[0];

    // 获取或创建 ydoc
    let ydoc = docsMap.get(docId);
    if (!ydoc) {
      ydoc = new Y.Doc();

      // 关键！必须与前端完全一致的共享类型初始化
      const ytext = ydoc.getText('quill'); // 确保类型名称与前端一致

      const testdoc = await getDocument({ docId, userId });
      console.log("数据库数据", new Uint8Array(testdoc.ydocState.buffer));
      

      // 加载历史数据（如果有）
      try {
        console.log("是否有历史数据");
        
        const doc = await getDocument({ docId, userId });
        Y.applyUpdate(ydoc, new Uint8Array(doc.ydocState.buffer));        
      } catch (e) {
        console.error('加载历史数据失败:', e);
      }

      docsMap.set(docId, ydoc);
    }

    // 建立连接
    setupWSConnection(conn, req, { 
      roomName: docId, 
      doc: ydoc,
    });

    // 手动处理接收到的消息
    conn.on('message', async (message) => {
    //   console.log('接收到消息:', message);

      // 确保消息是ArrayBuffer
      if (message instanceof ArrayBuffer) {
        // 将ArrayBuffer转换为Uint8Array
        const update = new Uint8Array(message).subarray(3);
        console.log("后端二进制", update);
        
        try {
          // 应用更新到ydoc
          Y.applyUpdate(ydoc, update);
        //   safeApplyUpdate(ydoc, update);
        } catch (err) {
          console.error('处理消息失败:', err);
        }
      } else {
        console.error('消息类型不正确:', typeof message);
      }
    });

    // 绑定ydoc的update监听器
    ydoc.on('update', async (update) => {
      console.log('检测到文档更新', {
        updateLength: update.length,
        docId
      });

      try {
        await db.collection('docs').updateOne(
          { _id: new ObjectId(docId) },
          { 
            $set: { 
              ydocState: new Binary(Y.encodeStateAsUpdate(ydoc)),
              updateTime: new Date() 
            } 
          },
          { upsert: true }
        );
        console.log(`文档 ${docId} 持久化成功`);
      } catch (err) {
        console.error('持久化失败:', err);
      }
    });

    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}/${docId}`);
  });
}

function safeApplyUpdate(ydoc, potentialUpdate) {
  // 类型检查
  if (!(potentialUpdate instanceof Uint8Array)) {
    throw new Error('必须是Uint8Array类型');
  }

  // 长度检查（Yjs更新最小约12字节）
  if (potentialUpdate.length < 12) {
    throw new Error('数据过短，不是有效更新');
  }

  // 尝试解码验证
  try {
    const decoded = Y.decodeUpdate(potentialUpdate);
    if (!decoded.structs || !decoded.deleteSet) {
      throw new Error('无效的Yjs数据结构');
    }
  } catch (err) {
    throw new Error('Yjs解码失败: ' + err.message);
  }

  // 最终应用
  return Y.applyUpdate(ydoc, potentialUpdate);
}
