/**
 * AI 增强接口
 * 使用腾讯云 Cloudbase Node SDK 调用 AI Agent
 */
const express = require('express');
const router = express.Router();

// Cloudbase Node SDK
let cloudbase = null;

// 初始化 Cloudbase
try {
  const tcb = require('@cloudbase/node-sdk');
  
  const envId = process.env.CLOUDBASE_ENV || "cloud1-8gxevfq393690dfe";
  
  console.log('📦 环境 ID:', envId);
  console.log('🔑 API Key:', process.env.CLOUDBASE_APIKEY ? '已配置' : '未配置');
  
  // 使用服务端 API Key（从环境变量 CLOUDBASE_APIKEY 自动读取）
  cloudbase = tcb.init({
    env: envId,
    timeout: 60000 // AI 生成可能耗时较长
  });
  
  console.log('✅ Cloudbase Node SDK 初始化成功');
} catch (error) {
  console.warn('⚠️ Cloudbase Node SDK 初始化失败:', error.message);
}

// Agent ID
const AGENT_ID = 'agent-xiaopiaoshi-2end0lcd9c419f';

/**
 * POST /api/ai-enhance/ocr
 * OCR 识别增强
 */
router.post('/ocr', async (req, res) => {
  try {
    const { ocrText, baseInfo } = req.body;
    
    if (!ocrText || !baseInfo) {
      return res.json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 检查 Cloudbase 是否可用
    if (!cloudbase) {
      console.log('⚠️ Cloudbase 不可用，返回后端原始数据');
      return res.json({
        success: true,
        data: baseInfo,
        aiEnabled: false
      });
    }
    
    console.log('📤 [AI增强] 开始调用 AI Agent...');
    
    // 构建提示词
    const prompt = `你是一个智能记账助手，擅长从小票/发票文本中提取语义信息。

【OCR原始文本】
${ocrText}

【后端已提取的信息】
- 金额: ${baseInfo.amount || '未识别'}元
- 商家: ${baseInfo.merchant || '未识别'}
- 日期: ${baseInfo.date || '未识别'}
- 类型: ${baseInfo.type === 'income' ? '收入' : '支出'}

【你的任务】
请智能推断以下信息（以JSON格式返回，无需解释）：

1. **备注(remark)** - 这是最重要的字段！
   - 如果是餐饮：提取菜品名（如"红烧鸡腿、素菜"）
   - 如果是超市：提取商品名（如"可乐、薯片、面包"，最多3个，用顿号分隔）
   - 如果是交通：提取行程信息（如"上班通勤"）
   - 如果是其他：提取关键消费内容
   - 如果实在没有：留空字符串""

2. **商家优化(merchant)** - 仅在后端识别不准确时优化
   - 识别知名品牌（星巴克、麦当劳、海底捞、美团、饿了么等）
   - 保留分店信息（如"星巴克国贸店"）
   - 如果后端已正确识别，返回原值
   - 如果识别不出，返回空字符串""

3. **分类优化(categoryName)** - 根据商家和内容智能判断
   支出分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他
   收入分类：工资/兼职/奖金/红包/退款/报销/投资/礼金/出售/其他

【返回格式】
{"remark":"","merchant":"","categoryName":""}

注意：
- remark是核心，必须尽力提取有价值的信息
- 如果某个字段无法优化，返回空字符串""
- 不要编造信息，不确定就留空`;
    
    // 调用 AI Agent（使用 dataStream）
    let aiResult = { remark: '', merchant: '', categoryName: '' };
    
    try {
      const ai = cloudbase.ai();
      
      console.log('📤 [AI增强] 调用 bot.sendMessage...');
      const res = await ai.bot.sendMessage({
        botId: AGENT_ID,
        threadId: `thread-${Date.now()}`,
        runId: `run-${Date.now()}`,
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: prompt
          }
        ],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {}
      });
      
      console.log('✅ [AI增强] 调用成功，读取 dataStream...');
      
      let fullText = '';
      for await (const data of res.dataStream) {
        // 根据事件类型处理
        switch (data.type) {
          case 'TEXT_MESSAGE_CONTENT':
            fullText += data.delta;
            break;
          case 'RUN_ERROR':
            console.error('❌ [AI增强] 运行出错:', data.message);
            break;
          case 'RUN_FINISHED':
            console.log('✅ [AI增强] 运行结束');
            break;
        }
      }
      
      console.log('📥 [AI增强] AI 响应:', fullText);
      
      // 写入日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `\n=== ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `AI响应: ${fullText}\n`);
      
      // 解析 JSON
      try {
        let jsonStr = null;
        const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = fullText.indexOf('{');
          const lastBrace = fullText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = fullText.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          aiResult = JSON.parse(jsonStr);
        }
      } catch (error) {
        console.warn('⚠️ AI 响应解析失败:', error.message);
      }
      
    } catch (aiError) {
      console.error('❌ [AI增强] 调用失败:', aiError.message);
      
      // 写入错误日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `\n=== ERROR ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `错误: ${aiError.message}\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `堆栈: ${aiError.stack}\n`);
    }
    
    // 合并结果
    const finalResult = {
      ...baseInfo,
      remark: aiResult.remark || baseInfo.remark || '',
      merchant: aiResult.merchant || baseInfo.merchant || '',
      categoryName: aiResult.categoryName || baseInfo.categoryName || '其他'
    };
    
    // 根据分类名称匹配分类ID
    finalResult.categoryId = getCategoryIdByName(finalResult.categoryName, finalResult.type);
    
    console.log('✅ [AI增强] 完成');
    
    res.json({
      success: true,
      data: finalResult,
      aiEnabled: true
    });
    
  } catch (error) {
    console.error('❌ [AI增强] 失败:', error);
    
    res.json({
      success: true,
      data: req.body.baseInfo,
      aiEnabled: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-enhance/voice
 * 语音识别增强
 */
router.post('/voice', async (req, res) => {
  try {
    const { voiceText, baseInfo } = req.body;
    
    if (!voiceText || !baseInfo) {
      return res.json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 检查 Cloudbase 是否可用
    if (!cloudbase) {
      console.log('⚠️ Cloudbase 不可用，返回前端原始数据');
      return res.json({
        success: true,
        data: baseInfo,
        aiEnabled: false
      });
    }
    
    console.log('📤 [AI增强-语音] 开始调用 AI Agent...');
    
    // 构建提示词
    const prompt = `你是一个智能记账助手，擅长从语音文本中提取账单信息。

【语音原始文本】
${voiceText}

【前端已提取的信息】
- 金额: ${baseInfo.amount || '未识别'}元
- 商家/来源: ${baseInfo.merchant || '未识别'}
- 日期: ${baseInfo.date || '未识别'}
- 类型: ${baseInfo.type === 'income' ? '收入' : '支出'}
- 分类: ${baseInfo.categoryName || '未识别'}

【你的任务】
请智能推断以下信息（以JSON格式返回，无需解释）：

1. **备注(remark)** - 这是最重要的字段！
   - 如果是餐饮：提取菜品名（如"红烧鸡腿、素菜"）
   - 如果是超市：提取商品名（如"可乐、薯片、面包"，最多3个，用顿号分隔）
   - 如果是交通：提取行程信息（如"上班通勤"）
   - 如果是其他：提取关键消费内容
   - 如果实在没有：留空字符串""

2. **商家/来源优化(merchant)** - 仅在前端识别不准确时优化
   支出：识别知名品牌（星巴克、麦当劳、海底捞、美团、饿了么等）
   收入：识别具体来源（公司名、平台名等）
   - 如果前端已正确识别，返回原值
   - 如果识别不出，返回空字符串""

3. **分类优化(categoryName)** - 根据商家和内容智能判断
   支出分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他
   收入分类：工资/兼职/奖金/红包/退款/报销/投资/礼金/出售/其他

【返回格式】
{"remark":"","merchant":"","categoryName":""}

注意：
- remark是核心，必须尽力提取有价值的信息
- 如果某个字段无法优化，返回空字符串""
- 不要编造信息，不确定就留空`;
    
    // 调用 AI Agent（使用 dataStream）
    let aiResult = { remark: '', merchant: '', categoryName: '' };
    
    try {
      const ai = cloudbase.ai();
      
      console.log('📤 [AI增强-语音] 调用 bot.sendMessage...');
      const res = await ai.bot.sendMessage({
        botId: AGENT_ID,
        threadId: `thread-${Date.now()}`,
        runId: `run-${Date.now()}`,
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: prompt
          }
        ],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {}
      });
      
      console.log('✅ [AI增强-语音] 调用成功，读取 dataStream...');
      
      let fullText = '';
      for await (const data of res.dataStream) {
        // 根据事件类型处理
        switch (data.type) {
          case 'TEXT_MESSAGE_CONTENT':
            fullText += data.delta;
            break;
          case 'RUN_ERROR':
            console.error('❌ [AI增强-语音] 运行出错:', data.message);
            break;
          case 'RUN_FINISHED':
            console.log('✅ [AI增强-语音] 运行结束');
            break;
        }
      }
      
      console.log('📥 [AI增强-语音] AI 响应:', fullText);
      
      // 写入日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `\n=== ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `AI响应: ${fullText}\n`);
      
      // 解析 JSON
      try {
        let jsonStr = null;
        const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = fullText.indexOf('{');
          const lastBrace = fullText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = fullText.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          aiResult = JSON.parse(jsonStr);
        }
      } catch (error) {
        console.warn('⚠️ AI 响应解析失败:', error.message);
      }
      
    } catch (aiError) {
      console.error('❌ [AI增强-语音] 调用失败:', aiError.message);
      
      // 写入错误日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `\n=== ERROR ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `错误: ${aiError.message}\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `堆栈: ${aiError.stack}\n`);
    }
    
    // 合并结果
    const finalResult = {
      ...baseInfo,
      remark: aiResult.remark || baseInfo.remark || '',
      merchant: aiResult.merchant || baseInfo.merchant || '',
      categoryName: aiResult.categoryName || baseInfo.categoryName || '其他'
    };
    
    // 根据分类名称匹配分类ID
    finalResult.categoryId = getCategoryIdByName(finalResult.categoryName, finalResult.type);
    
    console.log('✅ [AI增强-语音] 完成');
    
    res.json({
      success: true,
      data: finalResult,
      aiEnabled: true
    });
    
  } catch (error) {
    console.error('❌ [AI增强-语音] 失败:', error);
    
    res.json({
      success: true,
      data: req.body.baseInfo,
      aiEnabled: false,
      error: error.message
    });
  }
});

/**
 * 根据分类名称获取分类ID
 */
function getCategoryIdByName(categoryName, type) {
  const expenseCategories = {
    '餐饮': 1, '交通': 2, '购物': 3, '娱乐': 4,
    '住房': 5, '医疗': 6, '通讯': 7, '服饰': 8,
    '美容': 9, '学习': 10, '社交': 11, '零食': 13,
    '数码': 14, '家居': 15, '汽车': 16, '宠物': 17,
    '其他': 12
  };
  
  const incomeCategories = {
    '工资': 101, '兼职': 102, '奖金': 103, '红包': 104,
    '退款': 105, '报销': 106, '投资': 107, '礼金': 109,
    '出售': 110, '其他': 108
  };
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  return categories[categoryName] || (type === 'income' ? 108 : 12);
}

module.exports = router;
