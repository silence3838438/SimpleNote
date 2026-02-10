/**
 * 测试 Cloudbase Agent 调用
 */
const cloudbase = require('@cloudbase/node-sdk');

// 方式1：只使用 env（云函数模式）
console.log('\n=== 测试方式1：只使用 env ===');
const app1 = cloudbase.init({
  env: 'cloud1-8gxevfq393690dfe',
  timeout: 60000
});

// 方式2：使用 secretId + secretKey（独立服务模式）
console.log('\n=== 测试方式2：使用 secretId + secretKey ===');
const app2 = cloudbase.init({
  env: 'cloud1-8gxevfq393690dfe',
  secretId: 'AKIDhhYGoFZ2NajkeO0TlqiSzJQKI4gfZHoR',
  secretKey: 'XrAIceWDkAB2hIF5kDUfhaP6cvBH9pHg',
  timeout: 60000
});

// 使用方式2
const app = app2;
console.log('📦 环境 ID:', 'cloud1-8gxevfq393690dfe');

console.log('✅ Cloudbase 初始化完成');

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
    console.error('错误堆栈:', error.stack);
  }
}

testAgent();
