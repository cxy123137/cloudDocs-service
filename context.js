import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

// 获取当前请求的上下文
function getContext() {
  return asyncLocalStorage.getStore();
}

// 设置上下文中间件
function setContext(req, res, next) {
  // 初始化上下文（可存储用户信息、请求ID等）
  const context = { 
    // 近似java的线程id，因为是单线程多路复用，所以每个用户都是一个请求
    requestId: req.headers['x-request-id'] || Math.random().toString(36).slice(2),
    user: null // 稍后从数据库填充
  };
  asyncLocalStorage.run(context, () => next());
}

export { getContext, setContext };