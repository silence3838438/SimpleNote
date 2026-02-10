/**
 * 测试使用 API Key 方式调用 Cloudbase Agent
 */
const cloudbase = require('@cloudbase/node-sdk');

const envId = 'cloud1-8gxevfq393690dfe';
const apiKey = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS04Z3hldmZxMzkzNjkwZGZlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6NDA3MzUyODQ5OCwiaWF0IjoxNzY5ODQ1Mjk4LCJub25jZSI6IlBIVEpiS0VaUkktUmo5LXlxTjdGT2ciLCJhdF9oYXNoIjoiUEhUSmJLRVpSSS1SajkteXFON0ZPZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.o7cQi9-7kvHf_QdACOPxLAo36GOgGkzrkL93QLjXbBo71daeJOyIkjQJFle4_YpfrY2vwHcZ-EPG8COprAR3Vf6cfN9djeZZFzjLkK6t7EZTjBaafHwf244JEJWE7lWmmFEslY2V9INWlQ0Ib5_lhnyX-btdgmEJAbTB0zn2jHbk4sPxi9fvnhvaLdkTFIcEW5K_dn-_uU6mlcY1U2owdsLB6XJ7sNgLJVOYf1BtzjJJCB1p17ZwBaIp9YLV5MWibPS0WX6c-PDcgb4DBIeh4aIKjBVSnZPXTjrwZUSH1s63swdL79d1gsp3ipwUTg5nXupSll5bdxDfVYhW2f4yKA';

console.log('📦 环境 ID:', envId);
console.log('🔑 API Key:', apiKey.substring(0, 50) + '...');

// 使用 publishableKey 方式初始化（匿名访问）
const app = cloudbase.init({
  env: envId,
  publishableKey: apiKey,
  timeout: 60000
});

console.log('✅ Cloudbase 初始化完成（使用 publishableKey）');

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
        { id: 'msg-1', role: 'user', content: '你好，请回复"测试成功"' }
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
    console.error('错误详情:', error);
  }
}

testAgent();
