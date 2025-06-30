import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils.js');
const wsPort = 8001;
// 哈希表维护每个房间的连接列表，广播实现同个房间（文档）的连接互相通信
const clientsMap = new Map();

export async function setupWSServer() {
  const wss = new WebSocketServer({ port: wsPort, maxPayload: 10 * 1024 * 1024, perMessageDeflate: false });
  wss.on('connection', async (conn, req) => {
    const parts = req.url.split('/');
    if (parts[1] !== 'onlineEdit') {
      conn.close();
      return;
    }
    // 获取文档id后续作为roomName
    const docId = parts[3].toString().split('?')[0];

    // 根据（房间）获取/创建连接列表
    let clients = clientsMap.get(docId);
    if (!clients) {
      // 房间唯一
      clients = new Set();
      // 连接唯一
      clientsMap.set(docId, clients);
    }

    // 将当前连接添加到连接列表
    clients.add(conn);

    // 建立连接
    setupWSConnection(conn, req, { 
      roomName: docId, 
      disableBc: true // 禁用自动广播
    });

    // 监听消息并广播处理update
    conn.on('message', async (message) => {
      if (clients) {
        // 广播更新到所有连接的客户端
        for (const client of clients) {
          client.send(message);
          console.log('房间号：', docId, '连接号', conn.id);
        }
      }
    });

    // 清理
    conn.on('close', () => {
      const clients = clientsMap.get(docId);
      if (clients) {
        clients.delete(conn);
        if (clients.size === 0) {
          clientsMap.delete(docId);
        }
      }
    });

    console.log(`WebSocket 服务已启动：ws://localhost:${wsPort}/${docId}`);
  });
}