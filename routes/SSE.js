import express from 'express';
const SSERouter = express.Router();

const clients = new Set();
SSERouter.get('/refreshCommentData', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Encoding': 'none'
  });

  clients.add(res);
  
  req.on('close', () => {
    clients.delete(res); // 连接关闭时移除
    res.end();
  });
});

// 广播
export function broadcast(type) {
    console.log('广播1', clients.size);
    
  clients.forEach(client => {
    try {  
      client.write(`data: ${type}\n\n`);
      console.log('广播');
      
    } catch (e) {
      console.error(`连接广播失败`, e);
      clients.delete(client);
    }
  })
}

export { SSERouter };