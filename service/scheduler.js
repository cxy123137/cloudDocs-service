import { checkAllDocumentsSummary } from './summary.js';

// 定时任务管理器
class Scheduler {
  constructor() {
    this.intervals = new Map();
    this.isRunning = false;
  }

  // 启动定时任务
  start() {
    if (this.isRunning) {
      console.log('定时任务已在运行中');
      return;
    }

    console.log('启动文档摘要定时检查任务...');
    
    // 每30分钟检查一次文档摘要
    const summaryCheckInterval = setInterval(async () => {
      try {
        console.log('开始定时检查文档摘要...');
        await checkAllDocumentsSummary();
        console.log('定时检查文档摘要完成');
      } catch (error) {
        console.error('定时检查文档摘要失败:', error);
      }
    }, 30 * 60 * 1000); // 30分钟

    this.intervals.set('summaryCheck', summaryCheckInterval);
    this.isRunning = true;

    // 立即执行一次检查
    checkAllDocumentsSummary().catch(error => {
      console.error('初始检查文档摘要失败:', error);
    });

    console.log('文档摘要定时检查任务已启动，每30分钟检查一次');
  }

  // 停止定时任务
  stop() {
    if (!this.isRunning) {
      console.log('定时任务未在运行');
      return;
    }

    console.log('停止定时任务...');
    
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`已停止定时任务: ${name}`);
    }
    
    this.intervals.clear();
    this.isRunning = false;
    console.log('所有定时任务已停止');
  }

  // 获取任务状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.intervals.keys())
    };
  }
}

// 创建全局定时任务实例
const scheduler = new Scheduler();

// 导出定时任务实例
export { scheduler };

// 应用退出时停止定时任务
process.on('SIGINT', () => {
  console.log('正在停止定时任务...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('正在停止定时任务...');
  scheduler.stop();
  process.exit(0);
}); 