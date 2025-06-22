import { WebSocketServer } from 'ws';
import { connectToDatabase } from '../db.js';
import { getDocument } from '../service/doc.js'
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
  const wss = new WebSocketServer({ port: wsPort });

  wss.on('connection', async (conn, req) => {
    
    const parts = req.url.split('/');
    if (parts[1] !== 'onlineEdit') {
      conn.close();
      return;
    }
    const userId = parts[2].toString();
    const docId = parts[3].toString().split('?')[0];    
        

    // 获取ydoc
    let ydoc = docsMap.get(docId);
    
    // 如果ydoc不存在则创建
    if (!ydoc) {
      ydoc = new Y.Doc();
      // 确保创建共享类型（与前端的'quill'对应）
      ydoc.getText('quill'); // 关键！创建相同的共享类型
  
      // 加载历史状态（使用最近访问逻辑更新，使用ws连接查询文档）
      const doc = await getDocument({ docId, userId });    
    //   const doc = await db.collection('docs').findOne({ _id: new ObjectId(docId) });      
      
      if (doc) {
        // 从数据库的binary转化为Uint8Array给ydoc所需
        Y.applyUpdate(ydoc, new Uint8Array(doc.ydocState.buffer));        
      }

      docsMap.set(docId, ydoc);
    }


    conn.on('close', () => {
        console.log(docId);
        
        const result = db.collection('docs').updateOne(
          { _id: new ObjectId(docId) },
          { $set: {  updateTime: new Date() } },
        //   { upsert: true }
        );
        console.log(result.modifiedCount);
        
        console.log(11111);
        
    });

    // 开启链接
    setupWSConnection(conn, req, { roomName: docId, doc: ydoc });
    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}/${docId}`);
  });
}


        
        












export async function aaaa() {
    const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
    // 1. 解析前端发送的二进制更新
      const update = new Uint8Array(message);
      const roomId = getRoomIdFromWebSocket(ws); // 根据业务逻辑获取文档ID

    // 2. 获取或创建对应的 Y.Doc
      let ydoc = docsMap.get(roomId);
      if (!ydoc) {
        ydoc = new Y.Doc();
        docsMap.set(roomId, ydoc);
      }

    // 3. 应用更新到 Y.Doc
      Y.applyUpdate(ydoc, update);

    // 4. 广播更新给其他客户端（可选）
      broadcastToRoom(roomId, update);
    });
  });
}

function broadcastToRoom(roomId, update) {
  wss.clients.forEach((client) => {
    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(update);
    }
  });
}





// import { WebSocketServer } from 'ws';
// import { connectToDatabase } from '../db.js';
// import * as Y from 'yjs';
// import { Binary, ObjectId } from 'mongodb';

// const wsPort = 8001;
// const { db } = await connectToDatabase();

// // 维护文档状态的Map
// const docsMap = new Map();

// // 防抖保存计时器Map
// const saveTimers = new Map();

// export async function setupWSServer() {
//   const wss = new WebSocketServer({ port: wsPort });

//   wss.on('connection', async (conn, req) => {
//     const parts = req.url.split('/');
//     if (parts[1] !== 'onlineEdit') {
//       conn.close();
//       return;
//     }

//     const userId = parts[2].toString();
//     console.log(userId);
    
//     const docId = parts[3].split('?')[0].toString();
//     console.log(docId);
    

//     try {
//       // 获取或创建ydoc
//       let ydoc = docsMap.get(docId);
//       if (!ydoc) {
//         ydoc = await initializeYDoc(docId, userId);
//         docsMap.set(docId, ydoc);
//       }

//       // 设置连接关联
//       conn.roomId = docId;
//       conn.ydoc = ydoc;

//       // 消息处理
//       conn.on('message', async (message) => {
//         console.log(11);
        
//         try {
//           // 处理二进制更新
//           const update = new Uint8Array(message);
//           Y.applyUpdate(ydoc, update);
          
//           // 触发保存逻辑
//           triggerDebouncedSave(docId, ydoc);
          
//           // 广播给同房间其他客户端
//           broadcastUpdate(wss, docId, update, conn);
//         } catch (err) {
//           console.error('处理消息失败:', err);
//         }
//       });

//       // 连接关闭处理
//       conn.on('close', () => {
//         cleanupConnection(docId, conn);
//       });

//       console.log(`客户端已连接: ${userId}@${docId}`);

//     } catch (err) {
//       console.error('连接初始化失败:', err);
//       conn.close();
//     }
//   });
// }

// // 初始化Y.Doc
// async function initializeYDoc(docId, userId) {
//   const ydoc = new Y.Doc();
  
//   // 创建共享类型（必须与前端一致）
//   ydoc.getText('quill');
  
//   // 加载历史状态
//   const doc = await db.collection('docs').findOne({ 
//     _id: new ObjectId(docId) 
//   });

//   if (doc?.ydocState) {
//     Y.applyUpdate(ydoc, new Uint8Array(doc.ydocState.buffer));
//   }

//   return ydoc;
// }

// // 防抖保存
// function triggerDebouncedSave(docId, ydoc) {
//   clearTimeout(saveTimers.get(docId));
  
//   saveTimers.set(docId, setTimeout(async () => {
//     try {
//       await db.collection('docs').updateOne(
//         { _id: new ObjectId(docId) },
//         { 
//           $set: { 
//             ydocState: new Binary(Y.encodeStateAsUpdate(ydoc)),
//             updateTime: new Date() 
//           } 
//         },
//         { upsert: true }
//       );
//       console.log(`文档 ${docId} 已保存`);
//     } catch (err) {
//       console.error('保存文档失败:', err);
//     }
//   }, 10000)); // 10秒防抖
// }

// // 广播更新
// function broadcastUpdate(wss, roomId, update, excludeConn) {
//   wss.clients.forEach(client => {
//     if (client !== excludeConn && 
//         client.roomId === roomId && 
//         client.readyState === 1) {
//       client.send(update);
//     }
//   });
// }

// // 清理连接
// function cleanupConnection(docId, conn) {
//   clearTimeout(saveTimers.get(docId));
//   console.log(`客户端断开连接: ${conn.roomId}`);
// }
