// 配置全局mongodb对象
import { MongoClient } from 'mongodb';
import 'dotenv/config'; // 加载环境变量

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME;

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// 应用退出，关闭连接
process.on('SIGINT', async () => {
  if (cachedClient) await cachedClient.close();
  process.exit(0);
});