/**
 * 测试只使用 env 参数（无鉴权）
 */
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: 'cloud1-8gxevfq393690dfe',
  timeout: 60000
});

console.log('✅ Cloudbase 初始化完成（只使用 env）');

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
    console.error('错误代码:', error.code);
  }
}

testAgent();
