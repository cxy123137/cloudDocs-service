// WebSocket 最大连接数测试
async function testMaxWebSocketConnections(url, maxAttempts = 500) {
  const connections = [];
  let successfulConnections = 0;
  let failedConnections = 0;

  console.log(`开始测试，目标最大连接数: ${maxAttempts}`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        successfulConnections++;
        console.log(`连接 #${i+1} 成功 (总计: ${successfulConnections})`);
      };

      ws.onerror = (err) => {
        failedConnections++;
        console.error(`连接 #${i+1} 失败:`, err);
      };

      connections.push(ws);
      
      // 控制连接创建速度 (每秒10个新连接)
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`创建连接 #${i+1} 时异常:`, err);
      break;
    }
  }

  // 保持连接状态
  console.log(`
    测试完成:
    - 成功连接数: ${successfulConnections}
    - 失败连接数: ${failedConnections}
    - 保持连接中...
  `);

  // 30分钟后自动关闭所有连接
  setTimeout(() => {
    connections.forEach(ws => ws.close());
    console.log('已关闭所有连接');
  }, 1800000);
}

// 使用示例 (替换为你的WS地址)
testMaxWebSocketConnections('ws://localhost:8001/onlineEdit/6869015a51b8fb08e347e39f/686cbe147e435f72ff5745f1', 1000);