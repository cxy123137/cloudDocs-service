# AI摘要功能API接口设计文档

## 概述

本文档详细说明了AI摘要功能的后端API接口设计，包括接口调用方式、参数说明、返回值格式以及核心的AI摘要生成逻辑。

## 环境配置

### 必需环境变量
```bash
# 豆包AI配置
ARK_API_KEY=your_ark_api_key
ARK_MODEL_ID=your_model_id

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/clouddocs

# 服务器配置
PORT=3000
NODE_ENV=development
```

## API接口详细设计

### 1. 生成文档摘要

**接口信息**：
- **URL**: `POST /summary/generate`
- **功能**: 为指定文档生成AI摘要
- **认证**: 需要JWT token

**输入参数**：
```javascript
{
  docId: string,   // 文档ID（必需）- 24位hex字符串
  userId?: string  // 用户ID（可选）- 不用于权限验证
}
```

**输出参数**：
```javascript
// 成功响应 (200)
{
  "code": 200,
  "message": "摘要生成成功",
  "data": {
    "summary": "生成的摘要内容"
  }
}

// 内容过短响应 (400)
{
  "code": 400,
  "message": "文档内容过短，无法生成摘要（需要至少50个字符）"
}
```

**调用示例**：
```javascript
const response = await fetch('/summary/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    docId: '685e5f92a57b6ee1eb78abfa'
  })
});
```

### 2. 获取文档摘要

**接口信息**：
- **URL**: `GET /summary/getSummary?docId={docId}`
- **功能**: 获取指定文档的现有摘要
- **认证**: 需要JWT token

**输入参数**：
- `docId`: 文档ID（查询参数）- 24位hex字符串

**输出参数**：
```javascript
// 成功响应 (200)
{
  "code": 200,
  "message": "获取摘要成功",
  "data": {
    "_id": "摘要记录ID",
    "docId": "文档ID",
    "summary": "摘要内容",
    "contentLength": 212,
    "createTime": "2025-06-27T09:46:14.651Z",
    "updateTime": "2025-06-27T09:46:14.651Z"
  }
}
```

### 3. 检查并更新文档摘要

**接口信息**：
- **URL**: `POST /summary/checkAndUpdateSummary`
- **功能**: 检查文档内容变化并自动更新摘要
- **认证**: 需要JWT token

**输入参数**：
```javascript
{
  docId: string  // 文档ID（必需）- 24位hex字符串
}
```

**输出参数**：
```javascript
// 成功响应 (200)
{
  "code": 200,
  "message": "摘要检查完成"
}
```

### 4. 批量检查所有文档摘要

**接口信息**：
- **URL**: `POST /summary/checkAllSummaries`
- **功能**: 批量检查所有文档的摘要状态（异步执行）
- **认证**: 需要JWT token

**输入参数**: 无

**输出参数**：
```javascript
// 成功响应 (200)
{
  "code": 200,
  "message": "批量检查摘要任务已启动，请查看服务器日志了解进度"
}
```

### 5. 删除文档摘要

**接口信息**：
- **URL**: `DELETE /summary/deleteSummary/:docId`
- **功能**: 删除指定文档的摘要记录
- **认证**: 需要JWT token

**输入参数**：
- `docId`: 文档ID（路径参数）- 24位hex字符串

**输出参数**：
```javascript
// 成功响应 (200)
{
  "code": 200,
  "message": "摘要删除成功"
}
```

## AI摘要生成逻辑详解

### 1. 内容预处理流程

**文本提取机制**：
系统支持多种文档内容格式的文本提取，包括字符串、对象、数组和Yjs协作编辑器的数据结构。核心逻辑是递归遍历内容结构，提取所有文本信息。

```javascript
function extractTextFromContent(content) {
  if (!content) return '';
  
  let text = '';
  
  // 字符串格式：直接返回
  if (typeof content === 'string') {
    return content.trim();
  }
  
  // 对象格式：递归提取文本
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
```

### 2. AI摘要生成流程

**生成条件验证**：
- 文档内容长度必须≥50个字符
- 文档必须存在且有效
- 用户必须有访问权限

**AI接口调用**：
系统使用豆包AI的ARK模型进行摘要生成，通过精心设计的prompt确保摘要质量和长度控制。

```javascript
export async function generateSummary(docId, content) {
  try {
    const text = extractTextFromContent(content);
    
    // 内容长度验证
    if (text.length < 50) {
      return null;
    }
    
    // 限制文本长度，避免超出API限制
    const maxLength = 4000;
    const truncatedText = text.length > maxLength ? 
      text.substring(0, maxLength) + '...' : text;
    
    // 调用豆包AI接口
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
      model: process.env.ARK_MODEL_ID,
      max_tokens: 400,
      temperature: 0.3
    });
    
    let summary = response.choices[0]?.message?.content?.trim();
    
    if (summary) {
      // 确保摘要不超过200字
      if (summary.length > 200) {
        summary = summary.substring(0, 200);
        // 尝试在句号处截断
        const lastPeriodIndex = summary.lastIndexOf('。');
        const lastExclamationIndex = summary.lastIndexOf('！');
        const lastQuestionIndex = summary.lastIndexOf('？');
        const lastDotIndex = summary.lastIndexOf('.');
        
        const maxIndex = Math.max(lastPeriodIndex, lastExclamationIndex, lastQuestionIndex, lastDotIndex);
        if (maxIndex > 150) {
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
```

### 3. 自动更新机制

**内容变化检测**：
系统通过比较文档内容长度变化和更新时间来判断是否需要重新生成摘要。当检测到内容变化且满足生成条件时，自动触发摘要更新。

```javascript
export async function checkAndUpdateSummary(docId) {
  try {
    // 获取文档信息
    const doc = await db.collection('docs').findOne({
      _id: safeObjectId(docId),
      valid: 1
    });
    
    if (!doc) {
      return;
    }
    
    // 获取现有摘要
    const existingSummary = await getSummary(docId);
    
    // 提取文档文本
    const text = extractTextFromContent(doc.content);
    const currentLength = text.length;
    
    // 检查是否需要更新摘要
    const needsUpdate = !existingSummary || 
                       existingSummary.contentLength !== currentLength ||
                       doc.updateTime > existingSummary.updateTime;
    
    if (needsUpdate && currentLength >= 50) {
      await generateSummary(docId, doc.content);
    }
  } catch (error) {
    console.error(`检查文档 ${docId} 摘要失败:`, error);
    throw error;
  }
}
```

### 4. 数据存储机制

**摘要保存逻辑**：
系统使用MongoDB的upsert操作来保存摘要数据，确保数据的一致性和避免重复插入。

```javascript
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
```

## 错误处理机制

### 参数验证
系统对所有输入参数进行严格验证，确保数据格式的正确性和安全性。

```javascript
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
```

### 网络异常处理
- 处理AI接口调用超时
- 处理API调用频率限制
- 实现重试机制和降级处理

### 业务逻辑异常
- 处理格式不支持的文档内容
- 处理文本提取失败的情况
- 提供默认处理方案

## 性能优化

### 数据库优化
- 使用upsert操作，避免重复插入
- 建立索引提高查询性能
- 定期清理过期摘要数据

### 缓存策略
- 摘要内容缓存
- 查询结果缓存
- 减少重复计算

### 异步处理
- 批量操作异步执行
- 非阻塞式摘要生成
- 后台任务处理

## 定时任务

### 自动摘要更新
系统每小时自动检查一次所有文档的摘要状态，确保摘要内容的及时更新。

```javascript
// 每小时检查一次所有文档摘要
cron.schedule('0 * * * *', async () => {
  try {
    await checkAllDocumentsSummary();
  } catch (error) {
    console.error('定时检查摘要失败:', error);
  }
});
```

### 数据清理任务
系统每天自动清理过期的摘要数据，避免存储空间的浪费。

```javascript
// 每天清理过期的摘要数据
cron.schedule('0 2 * * *', async () => {
  try {
    // 清理30天前的摘要数据
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.collection('docSummaries').deleteMany({
      updateTime: { $lt: thirtyDaysAgo }
    });
  } catch (error) {
    console.error('清理摘要数据失败:', error);
  }
});
```

## 并发调用处理

### 并发场景分析

在实际使用中，AI摘要功能可能面临以下并发调用场景：

#### 1. 多用户同时编辑同一文档
- **场景**：多个用户同时编辑同一个文档，触发摘要生成
- **问题**：可能导致重复的AI接口调用，增加成本
- **影响**：API调用频率限制、数据库写入冲突

#### 2. 批量操作并发执行
- **场景**：定时任务和手动操作同时进行
- **问题**：大量文档同时触发摘要检查
- **影响**：服务器资源消耗、数据库性能下降

#### 3. 前端频繁触发
- **场景**：用户快速切换文档或频繁保存
- **问题**：短时间内多次调用同一接口
- **影响**：不必要的API调用、用户体验下降

### 解决方案设计

#### 1. 请求去重机制
系统使用基于文档ID的请求去重机制，避免同一文档的重复请求。

```javascript
const pendingRequests = new Map();

async function deduplicateRequest(docId, requestFunction) {
  if (pendingRequests.has(docId)) {
    return pendingRequests.get(docId);
  }
  
  const requestPromise = requestFunction().finally(() => {
    pendingRequests.delete(docId);
  });
  
  pendingRequests.set(docId, requestPromise);
  return requestPromise;
}
```

#### 2. 数据库锁机制
系统使用乐观锁机制确保数据一致性，避免并发更新冲突。

```javascript
async function saveSummaryWithOptimisticLock(docId, summary, contentLength, version) {
  const result = await db.collection('docSummaries').updateOne(
    { docId: safeObjectId(docId), version: version },
    { $set: { summary, contentLength, updateTime: new Date(), version: version + 1 } }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('数据已被其他请求修改，请重试');
  }
  
  return result;
}
```

#### 3. 队列处理机制
系统使用内存队列处理摘要生成请求，确保请求的有序处理。

```javascript
class SummaryQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(docId, content) {
    return new Promise((resolve, reject) => {
      this.queue.push({ docId, content, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }
  
  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      try {
        const result = await generateSummary(task.docId, task.content);
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.processing = false;
  }
}
```

#### 4. 限流机制
系统使用令牌桶限流机制控制请求频率，避免API调用过于频繁。

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  async take() {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }
}
```

### 实际应用策略

#### 1. 分层防护机制
系统采用分层防护机制，从多个层面确保并发调用的稳定性。

```javascript
export async function generateSummaryWithConcurrencyControl(docId, content) {
  try {
    // 第一层：请求去重
    const deduplicatedRequest = deduplicateRequest(docId, async () => {
      // 第二层：限流检查
      const canProceed = await slidingWindowLimiter.allow();
      if (!canProceed) {
        throw new Error('请求频率过高，请稍后再试');
      }
      
      // 第三层：队列处理
      return summaryQueue.add(docId, content);
    });
    
    return await deduplicatedRequest;
  } catch (error) {
    console.error('并发控制失败:', error);
    throw error;
  }
}
```

#### 2. 错误处理和重试
系统实现了完善的错误处理和重试机制，确保请求的可靠性。

```javascript
async function generateSummaryWithRetry(docId, content, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateSummaryWithConcurrencyControl(docId, content);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 性能优化建议

#### 1. 缓存策略
- 对相同内容的摘要进行缓存
- 使用Redis缓存热点摘要
- 实现摘要内容的版本控制

#### 2. 批量处理
- 将多个摘要请求合并为批量操作
- 使用数据库批量写入操作
- 实现异步批量处理机制

#### 3. 资源管理
- 合理设置连接池大小
- 监控内存使用情况
- 定期清理过期缓存和队列

### 测试验证

#### 并发测试场景
系统提供了完整的并发测试函数，可以验证各种并发场景下的系统表现。

```javascript
async function testConcurrency() {
  const docId = 'test_doc_id';
  const content = '测试文档内容...';
  const concurrentRequests = 10;
  
  const promises = Array(concurrentRequests).fill().map(() =>
    generateSummaryWithConcurrencyControl(docId, content)
  );
  
  try {
    const results = await Promise.all(promises);
    console.log(`并发测试成功，处理了 ${results.length} 个请求`);
  } catch (error) {
    console.error('并发测试失败:', error);
  }
}
```

通过这些并发处理机制，可以有效解决多用户同时使用AI摘要功能时可能出现的各种并发问题，确保系统的稳定性和性能。 