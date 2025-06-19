import express from 'express';
import { connectToDatabase } from '../db.js';

const documentsrouter = express.Router();
const { db } = connectToDatabase();

// 查询文档
documentsrouter.get('/getDoc', async (req, res) => {
  try {
    const docs = await db.collection('docs').find({}).toArray();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 插入文档
documentsrouter.post('/addDoc', async (req, res) => {
  try {
    
    res.status(201).json({ message: 'Document inserted successfully', insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 更新文档
documentsrouter.put('/put/:id', async (req, res) => {
  try {
    const updateDoc = {
      $set: {
        baseId: req.body.baseId,
        content: req.body.content || {},
        version: req.body.version,
        snapshotAtVersion: req.body.snapshotAtVersion,
        snapshot: req.body.snapshot
      }
    };
    const result = await db.collection('docs').updateOne({ _id: req.params.id }, updateDoc);
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
    const result = await db.collection('docs').deleteOne({ _id: req.params.id });
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
