import express from 'express';
import { addDocument, getDocument, updateDocument, deleteDocument } from '../service/doc.js';

const documentsrouter = express.Router();

// 查询文档
documentsrouter.get('/getDoc', async (req, res) => {
  try {
    const { id } = req.query;
    const docs = await getDocument({ id });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 新建文档
documentsrouter.post('/addDoc', async (req, res) => {
  try {
    const { title, baseId, content, version, snapshotAtVersion, snapshot, valid,
    } = req.body;
    const result = await addDocument({
      title,
      baseId,
      content,
      version,
      snapshotAtVersion,
      snapshot,
      valid,
    });
    res.status(201).json({ code: 201, message: '文档新建成功', insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 更新文档
documentsrouter.put('/put/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, valid } = req.body;
    const result = await updateDocument({
      id,
      content,
      valid,
    });
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
    const { id } = req.params;
    const result = await deleteDocument({ id });
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