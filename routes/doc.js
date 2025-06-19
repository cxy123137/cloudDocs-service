import express from 'express';
import { addDocument, getDocument, updateDocument, deleteDocument } from '../service/doc.js';

const documentsrouter = express.Router();

// 查询文档
documentsrouter.get('/getDoc', async (req, res) => {
  try {
    const docs = await getDocument(req);
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 插入文档
documentsrouter.post('/addDoc', async (req, res) => {
  try {
    const result = await addDocument(req);
    res.status(201).json({ message: 'Document inserted successfully', insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 更新文档
documentsrouter.put('/put/:id', async (req, res) => {
  try {
    req.body._id = req.params.id; // 将文档ID添加到请求体中
    const result = await updateDocument(req);
    if (result.matchedCount === 1) {
      res.status(200).json({ message: 'Document updated successfully' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 删除文档
documentsrouter.delete('/delete/:id', async (req, res) => {
  try {
    req.body._id = req.params.id; // 将文档ID添加到请求体中
    const result = await deleteDocument(req);
    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Document deleted successfully' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

export { documentsrouter };
