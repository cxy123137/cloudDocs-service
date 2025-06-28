import express from 'express';
import { generateSummary, getSummary, checkAndUpdateSummary, checkAllDocumentsSummary, deleteSummary } from '../service/summary.js';
import { getDocument } from '../service/doc.js';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../db.js';

const { db } = await connectToDatabase();

function safeObjectId(id) {
  // 检查参数是否存在
  if (!id) {
    throw new Error('ObjectId参数不能为空');
  }
  
  // 如果已经是ObjectId对象，直接返回
  if (id.constructor.name === 'ObjectId') {
    return id;
  }
  
  if (typeof id !== 'string' || id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new Error('ObjectId参数必须为24位hex字符串或ObjectId对象');
  }
  return new ObjectId(id);
}

const summaryRouter = express.Router();

// 获取文档摘要
summaryRouter.get('/getSummary', async (req, res) => {
  try {
    const { docId } = req.query;
    
    if (!docId) {
      return res.status(400).json({ 
        code: 400, 
        message: '缺少必要参数: docId' 
      });
    }
    
    const summary = await getSummary(docId);
    
    if (summary) {
      res.status(200).json({ 
        code: 200, 
        message: '获取摘要成功', 
        data: summary 
      });
    } else {
      res.status(404).json({ 
        code: 404, 
        message: '该文档暂无摘要' 
      });
    }
  } catch (error) {
    console.error('获取摘要失败:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误，请稍后再试', 
      error: error.message 
    });
  }
});

// 手动生成文档摘要
summaryRouter.post('/generate', async (req, res) => {
  try {
    const { docId, userId } = req.body;
    
    if (!docId) {
      return res.status(400).json({ code: 400, message: '缺少必要参数: docId' });
    }
    
    const summary = await generateSummary(docId, userId);
    res.status(200).json({ code: 200, message: '摘要生成成功', data: summary });
  } catch (error) {
    console.error('生成摘要失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误，请稍后再试', error: error.message });
  }
});

// 检查并更新文档摘要
summaryRouter.post('/checkAndUpdateSummary', async (req, res) => {
  try {
    const { docId } = req.body;
    
    if (!docId) {
      return res.status(400).json({ 
        code: 400, 
        message: '缺少必要参数: docId' 
      });
    }
    
    await checkAndUpdateSummary(docId);
    
    res.status(200).json({ 
      code: 200, 
      message: '摘要检查完成' 
    });
  } catch (error) {
    console.error('检查摘要失败:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误，请稍后再试', 
      error: error.message 
    });
  }
});

// 批量检查所有文档摘要（管理员功能）
summaryRouter.post('/checkAllSummaries', async (req, res) => {
  try {
    // 异步执行，避免请求超时
    checkAllDocumentsSummary().catch(error => {
      console.error('批量检查摘要失败:', error);
    });
    
    res.status(200).json({ 
      code: 200, 
      message: '批量检查摘要任务已启动，请查看服务器日志了解进度' 
    });
  } catch (error) {
    console.error('启动批量检查失败:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误，请稍后再试', 
      error: error.message 
    });
  }
});

// 删除文档摘要
summaryRouter.delete('/deleteSummary/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    if (!docId) {
      return res.status(400).json({ 
        code: 400, 
        message: '缺少必要参数: docId' 
      });
    }
    
    await deleteSummary(docId);
    
    res.status(200).json({ 
      code: 200, 
      message: '摘要删除成功' 
    });
  } catch (error) {
    console.error('删除摘要失败:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器错误，请稍后再试', 
      error: error.message 
    });
  }
});

export { summaryRouter }; 