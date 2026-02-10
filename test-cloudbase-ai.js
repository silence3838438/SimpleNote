/**
 * Cloudbase AI 配置测试脚本
 * 测试 AI Agent 是否能正常工作
 */

const cloudbaseSDK = require('@cloudbase/js-sdk');

// 配置信息
const CONFIG = {
  env: "cloud1-8gxevfq393690dfe",
  region: "ap-shanghai",
  accessKey: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS04Z3hldmZxMzkzNjkwZGZlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6NDA3MzUyODQ5OCwiaWF0IjoxNzY5ODQ1Mjk4LCJub25jZSI6IlBIVEpiS0VaUkktUmo5LXlxTjdGT2ciLCJhdF9oYXNoIjoiUEhUSmJLRVpSSS1SajkteXFON0ZPZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.o7cQi9-7kvHf_QdACOPxLAo36GOgGkzrkL93QLjXbBo71daeJOyIkjQJFle4_YpfrY2vwHcZ-EPG8COprAR3Vf6cfN9djeZZFzjLkK6t7EZTjBaafHwf244JEJWE7lWmmFEslY2V9INWlQ0Ib5_lhnyX-btdgmEJAbTB0zn2jHbk4sPxi9fvnhvaLdkTFIcEW5K_dn-_uU6mlcY1U2owdsLB6XJ7sNgLJVOYf1BtzjJJCB1p17ZwBaIp9YLV5MWibPS0WX6c-PDcgb4DBIeh4aIKjBVSnZPXTjrwZUSH1s63swdL79d1gsp3ipwUTg5nXupSll5bdxDfVYhW2f4yKA",
  agentId: "agent-xiaopiaoshi-2end0lcd9c419f"
};

// 测试用的 OCR 文本（模拟小票内容）
const TEST_OCR_TEXT = `
美团外卖
订单号：1234567890
商家：星巴克国贸店
------------------
美式咖啡(大杯)  x1  ¥32.00
拿铁咖啡(中杯)  x1  ¥28.00
------------------
小计：¥60.00
优惠：-¥5.00
实付：¥55.00
------------------
2024-01-31 14:30
感谢您的光临！
`;

async function testCloudbaseAI() {
  console.log('='.repeat(60));
  console.log('🧪 开始测试 Cloudbase AI 配置');
  console.log('='.repeat(60));
  
  try {
    // 步骤 1: 初始化 SDK
    console.log('\n📦 步骤 1: 初始化 Cloudbase SDK...');
    const cloudbase = cloudbaseSDK.init({
      env: CONFIG.env,
      region: CONFIG.region,
      accessKey: CONFIG.accessKey
    });
    console.log('✅ SDK 初始化成功');
    
    // 步骤 2: 构建测试提示词
    console.log('\n📝 步骤 2: 构建 AI 提示词...');
    const prompt = `你是一个智能记账助手，擅长从小票/发票文本中提取语义信息。

【OCR原始文本】
${TEST_OCR_TEXT}

【后端已提取的信息】
- 金额: 55元
- 商家: 星巴克国贸店
- 日期: 2024-01-31
- 类型: 支出

【你的任务】
请智能推断以下信息（以JSON格式返回，无需解释）：

1. **备注(remark)** - 提取商品名称
   - 如果是餐饮：提取菜品名（如"美式咖啡、拿铁咖啡"）
   
2. **商家优化(merchant)** - 仅在后端识别不准确时优化
   - 如果后端已正确识别，返回原值
   
3. **分类优化(categoryName)** - 根据商家和内容智能判断
   支出分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他

【返回格式】
{"remark":"","merchant":"","categoryName":""}

注意：
- remark是核心，必须尽力提取有价值的信息
- 如果某个字段无法优化，返回空字符串""
- 不要编造信息，不确定就留空`;
    
    console.log('✅ 提示词构建完成');
    
    // 步骤 3: 调用 AI Agent
    console.log('\n🤖 步骤 3: 调用 AI Agent...');
    console.log(`Agent ID: ${CONFIG.agentId}`);
    
    const res = await cloudbase.ai().bot.sendMessage({
      botId: CONFIG.agentId,
      threadId: `test-thread-${Date.now()}`,
      runId: `test-run-${Date.now()}`,
      messages: [
        {
          id: `test-msg-${Date.now()}`,
          role: 'user',
          content: prompt
        }
      ],
      tools: [],
      context: [],
      state: {},
      forwardedProps: {}
    });
    
    console.log('✅ AI Agent 调用成功，开始接收响应...');
    
    // 步骤 4: 读取流式响应
    console.log('\n📥 步骤 4: 读取 AI 响应...');
    let fullText = '';
    let hasThinking = false;
    
    for await (const data of res.dataStream) {
      // 思维链内容
      const think = data.reasoning_content;
      if (think) {
        if (!hasThinking) {
          console.log('\n💭 思维链:');
          hasThinking = true;
        }
        console.log(`   ${think}`);
      }
      
      // 正文内容
      const content = data.content;
      if (content) {
        fullText += content;
      }
    }
    
    console.log('\n📄 AI 完整响应:');
    console.log('-'.repeat(60));
    console.log(fullText);
    console.log('-'.repeat(60));
    
    // 步骤 5: 解析 JSON 响应
    console.log('\n🔍 步骤 5: 解析 JSON 响应...');
    
    let jsonStr = null;
    
    // 尝试从代码块提取
    const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
      console.log('✅ 从代码块中提取 JSON');
    }
    
    // 尝试从大括号提取
    if (!jsonStr) {
      const firstBrace = fullText.indexOf('{');
      const lastBrace = fullText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = fullText.substring(firstBrace, lastBrace + 1);
        console.log('✅ 从大括号中提取 JSON');
      }
    }
    
    if (jsonStr) {
      try {
        const result = JSON.parse(jsonStr);
        console.log('\n✅ JSON 解析成功:');
        console.log(JSON.stringify(result, null, 2));
        
        // 验证结果
        console.log('\n📊 AI 增强结果验证:');
        console.log(`  备注: ${result.remark || '(空)'}`);
        console.log(`  商家: ${result.merchant || '(空)'}`);
        console.log(`  分类: ${result.categoryName || '(空)'}`);
        
      } catch (error) {
        console.error('❌ JSON 解析失败:', error.message);
        console.log('原始 JSON 字符串:', jsonStr);
      }
    } else {
      console.warn('⚠️ 未找到 JSON 数据');
    }
    
    // 测试成功
    console.log('\n' + '='.repeat(60));
    console.log('🎉 测试完成！Cloudbase AI 配置正确！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 测试失败！');
    console.error('='.repeat(60));
    console.error('\n错误信息:', error.message);
    console.error('\n错误堆栈:', error.stack);
    
    // 提供诊断建议
    console.log('\n🔧 诊断建议:');
    if (error.message.includes('accessKey')) {
      console.log('  - 检查 accessKey 是否正确');
      console.log('  - 确认 accessKey 未过期');
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('  - 检查网络连接');
      console.log('  - 确认防火墙设置');
    }
    if (error.message.includes('agent') || error.message.includes('bot')) {
      console.log('  - 检查 Agent ID 是否正确');
      console.log('  - 确认 Agent 已启用');
    }
    
    process.exit(1);
  }
}

// 运行测试
testCloudbaseAI();
