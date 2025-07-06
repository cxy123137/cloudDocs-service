import OpenAI from 'openai'; // 需安装 npm install openai

const client = new OpenAI({
  apiKey: "4a7c251b-7e73-4acf-8f41-b38e2f15df5e", // 火山方舟申请的 Key
  baseURL: "https://ark.cn-beijing.volces.com/api/v3", // 固定域名
});

export async function generateSummary(text) {
  const response = await client.chat.completions.create({
    model: "doubao-seed-1-6-250615", // 如 ep-xxxxx (从火山方舟复制)
    messages: [
      {
        role: "system",
        content: "你是一个专业的摘要生成助手，请用简洁的语言总结以下文本："
      },
      {
        role: "user",
        content: text // 要摘要的文本
      }
    ],
    max_tokens: 200, // 限制摘要长度
  });
  return response.choices[0].message.content;
}

// 调用示例
// const longText = "这是一段需要摘要的长文本，你好，欢迎使用摘要生成助手。我是一个阳光大男孩";
// const summary = generateSummary(longText).then(summary => console.log(summary));

// export default summary;