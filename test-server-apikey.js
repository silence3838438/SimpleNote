/**
 * 测试真正的服务端 API Key
 */
const cloudbase = require('@cloudbase/node-sdk');

// 设置环境变量（使用新的服务端 API Key）
process.env.CLOUDBASE_APIKEY = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6MjUzNDAyMzAwNzk5LCJpYXQiOjE3NzA3MTY0NDgsImF0X2hhc2giOiJYRmN0eU4wdFJzZUdrdEFpajZNT0JnIiwicHJvamVjdF9pZCI6ImNsb3VkMS04Z3hldmZxMzkzNjkwZGZlIiwibWV0YSI6eyJwbGF0Zm9ybSI6IkFwaUtleSJ9LCJhZG1pbmlzdHJhdG9yX2lkIjoiMjAxNDU5NDUzMDU4ODkzODI0MSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3NlcnZlciIsImlzX3N5c3RlbV9hZG1pbiI6dHJ1ZX0.QqIlG2KIN3ivyRiJZqVvLHxUT4EDTzK4DQOKpBymbWxZ6JeqMXKP2ss7qyHZg9A9C1rMwEA0RmCOuwhwmg4InmJDOV0LQKVrv5wy85KcF0WONZReKB9Y7bNJcSJI5Dw5jkgNzjNpp0Qr65Rm_zKKskir1LZKZsiJEGtvkpsQbP3T9Y_fA62UdwPTbwl21P5KfIVYMQRZn_aDxjlDy4HduvxWbR2lsfv50bq_8x5fZBQ64q3QISmdeGmktdNHnWBaQW2UuBvv6kAUr-TLmW_6hRIf2b6arSoXfu_lvGHxWjjEf9Oa00LsH65Oca9SDiAZH0lstByk2_w1OOxHiBLX-g';

const app = cloudbase.init({
  env: 'cloud1-8gxevfq393690dfe',
  timeout: 60000
});

console.log('✅ Cloudbase 初始化完成（使用服务端 API Key）');

const AGENT_ID = 'agent-xiaopiaoshi-2end0lcd9c419f';

async function testAgent() {
  try {
    const ai = app.ai();
    
    console.log('📤 调用 Agent...');
    
    const res = await ai.bot.sendMessage({
      botId: AGENT_ID,
      threadId: `thread-${Date.now()}`,
      runId: `run-${Date.now()}`,
      messages: [
        { id: 'msg-1', role: 'user', content: '你好，请回复"服务端API Key测试成功"' }
      ],
      tools: [],
      context: [],
      state: {},
      forwardedProps: {}
    });
    
    console.log('✅ 调用成功，读取响应...');
    
    let text = '';
    
    for await (const data of res.dataStream) {
      switch (data.type) {
        case 'TEXT_MESSAGE_CONTENT':
          text += data.delta;
          process.stdout.write(data.delta);
          break;
        
        case 'RUN_ERROR':
          console.error('\n❌ 运行出错:', data.message);
          break;
        
        case 'RUN_FINISHED':
          console.log('\n✅ 运行结束');
          break;
      }
    }
    
    console.log('\n\n完整响应:', text);
    console.log('响应长度:', text.length);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误代码:', error.code);
  }
}

testAgent();
