import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';
import 'dotenv/config';

const { db } = await connectToDatabase();

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

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
    throw new Error('docId必须为24位hex字符串或ObjectId对象');
  }
  return new ObjectId(id);
}

// 从文档内容中提取纯文本
function extractTextFromContent(content) {
  if (!content) return '';
  
  let text = '';
  
  // 如果content是字符串，直接返回
  if (typeof content === 'string') {
    return content.trim();
  }
  
  // 如果content是对象，递归提取文本
  if (typeof content === 'object') {
    if (Array.isArray(content)) {
      text = content.map(item => extractTextFromContent(item)).join(' ');
    } else {
      // 处理Yjs文档内容
      if (content.doc) {
        text = extractTextFromYjsContent(content.doc);
      } else {
        // 处理普通对象
        Object.values(content).forEach(value => {
          text += extractTextFromContent(value) + ' ';
        });
      }
    }
  }
  
  return text.trim();
}

// 从Yjs文档内容中提取文本
function extractTextFromYjsContent(doc) {
  if (!doc) return '';
  
  let text = '';
  
  // 处理Yjs的共享类型
  if (doc.share) {
    Object.values(doc.share).forEach(sharedType => {
      if (sharedType._map) {
        // 处理Map类型
        sharedType._map.forEach((value, key) => {
          if (typeof value === 'string') {
            text += value + ' ';
          } else if (value && typeof value === 'object') {
            text += extractTextFromContent(value) + ' ';
          }
        });
      } else if (sharedType._array) {
        // 处理Array类型
        sharedType._array.forEach(item => {
          if (typeof item === 'string') {
            text += item + ' ';
          } else if (item && typeof item === 'object') {
            text += extractTextFromContent(item) + ' ';
          }
        });
      } else if (sharedType._text) {
        // 处理Text类型
        text += sharedType._text.toString() + ' ';
      }
    });
  }
  
  return text.trim();
}

// 生成AI摘要（适配豆包ARK新版API）
export async function generateSummary(docId, content) {
  try {
    const text = extractTextFromContent(content);
    
    // 如果文本少于50个字符，不生成摘要
    if (text.length < 50) {
      return null;
    }
    
    // 限制文本长度，避免超出API限制
    const maxLength = 4000; // 留一些空间给prompt
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档摘要助手。请为给定的文档内容生成一个简洁、准确的摘要，突出文档的主要内容和要点。摘要必须控制在200字以内，不能超过200字。'
        },
        {
          role: 'user',
          content: `请为以下文档内容生成摘要（要求：1. 突出主要内容；2. 准确简洁；3. 严格控制在200字以内）：\n\n${truncatedText}`
        }
      ],
      model: process.env.ARK_MODEL_ID, // 豆包ARK模型ID
      max_tokens: 400, // 增加token限制以确保有足够空间生成200字摘要
      temperature: 0.3
    });
    
    let summary = response.choices[0]?.message?.content?.trim();
    
    if (summary) {
      // 确保摘要不超过200字
      if (summary.length > 200) {
        summary = summary.substring(0, 200);
        // 尝试在句号处截断，避免截断在句子中间
        const lastPeriodIndex = summary.lastIndexOf('。');
        const lastExclamationIndex = summary.lastIndexOf('！');
        const lastQuestionIndex = summary.lastIndexOf('？');
        const lastDotIndex = summary.lastIndexOf('.');
        
        const maxIndex = Math.max(lastPeriodIndex, lastExclamationIndex, lastQuestionIndex, lastDotIndex);
        if (maxIndex > 150) { // 如果找到标点符号且位置合理
          summary = summary.substring(0, maxIndex + 1);
        }
      }
      
      // 保存摘要到数据库
      await saveSummary(docId, summary, text.length);
      return summary;
    }
    
    return null;
  } catch (error) {
    console.error('生成摘要失败:', error);
    throw error;
  }
}

// 保存摘要到数据库
async function saveSummary(docId, summary, contentLength) {
  try {
    const summaryData = {
      docId: safeObjectId(docId),
      summary,
      contentLength,
      createTime: new Date(),
      updateTime: new Date()
    };
    
    // 使用upsert操作，如果存在则更新，不存在则插入
    await db.collection('docSummaries').updateOne(
      { docId: safeObjectId(docId) },
      { $set: summaryData },
      { upsert: true }
    );
  } catch (error) {
    console.error('保存摘要失败:', error);
    throw error;
  }
}

// 获取文档摘要
export async function getSummary(docId) {
  try {
    const summary = await db.collection('docSummaries').findOne({
      docId: safeObjectId(docId)
    });
    
    return summary;
  } catch (error) {
    console.error('获取摘要失败:', error);
    throw error;
  }
}

// 检查文档是否需要更新摘要
export async function checkAndUpdateSummary(docId) {
  try {
    // 获取文档内容
    const doc = await db.collection('docs').findOne({
      _id: safeObjectId(docId),
      valid: 1
    });
    
    if (!doc) {
      console.log(`文档 ${docId} 不存在或已删除`);
      return;
    }
    
    // 获取现有摘要
    const existingSummary = await getSummary(docId);
    
    // 提取文档文本
    const text = extractTextFromContent(doc.content);
    
    // 如果文档内容少于50个字符，删除摘要（如果存在）
    if (text.length < 50) {
      if (existingSummary) {
        await db.collection('docSummaries').deleteOne({
          docId: safeObjectId(docId)
        });
        console.log(`文档 ${docId} 内容过短（${text.length}个字符），摘要已删除`);
      }
      return;
    }
    
    // 检查是否需要更新摘要
    const needsUpdate = !existingSummary || 
                       existingSummary.contentLength !== text.length ||
                       (doc.updateTime && existingSummary.updateTime < doc.updateTime);
    
    if (needsUpdate) {
      console.log(`文档 ${docId} 需要更新摘要（内容长度：${text.length}个字符）`);
      await generateSummary(docId, doc.content);
    } else {
      console.log(`文档 ${docId} 摘要无需更新`);
    }
  } catch (error) {
    console.error(`检查文档 ${docId} 摘要失败:`, error);
  }
}

// 删除文档摘要
export async function deleteSummary(docId) {
  try {
    await db.collection('docSummaries').deleteOne({
      docId: safeObjectId(docId)
    });
    console.log(`文档 ${docId} 摘要已删除`);
  } catch (error) {
    console.error('删除摘要失败:', error);
    throw error;
  }
} 