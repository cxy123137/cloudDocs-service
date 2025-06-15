import express from 'express';
const documentsrouter = express.Router();

documentsrouter.get('/select', (req, res) => {
  res.send('Hello World!');
})

documentsrouter.post('/insert', (req, res) => {
  res.send('POST request received');
})

documentsrouter.delete('/delete/:id', (req, res) => {
  res.send('DELETE request received');
})

documentsrouter.put('/put/:id/:name', (req, res) => {
  // 路径参数
  const id = req.params.id;
  // 请求体
  const age = req.body.age;
  // 查询参数
  const name = req.query.name;
  res.status(200).send(`PUT request received for id: ${id}`);
})

export { documentsrouter }