/**
 * AI 增强接口
 * 使用 DeepSeek API（兼容 OpenAI SDK）
 */
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// 初始化 DeepSeek 客户端
let deepseekClient = null;

try {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  console.log('� DeepSeek API Key:', apiKey ? '已配置' : '未配置');
  
  if (apiKey) {
    deepseekClient = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    console.log('✅ DeepSeek API 初始化成功');
  } else {
    console.warn('⚠️ DeepSeek API Key 未配置');
  }
} catch (error) {
  console.warn('⚠️ DeepSeek API 初始化失败:', error.message);
}

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
    
    // 检查 DeepSeek 是否可用
    if (!deepseekClient) {
      console.log('⚠️ DeepSeek API 不可用，返回后端原始数据');
      return res.json({
        success: true,
        data: baseInfo,
        aiEnabled: false
      });
    }
    
    console.log('📤 [AI增强] 开始调用 DeepSeek API...');
    
    // 构建提示词
    const systemPrompt = `你是一个智能记账助手，擅长从小票/发票文本中提取语义信息。你必须严格按照JSON格式返回结果，不要有任何额外的解释文字。`;
    
    const userPrompt = `

【OCR原始文本】
${ocrText}

【后端已提取的信息】
- 金额: ${baseInfo.amount || '未识别'}元
- 商家: ${baseInfo.merchant || '未识别'}
- 日期: ${baseInfo.date || '未识别'}
- 类型: ${baseInfo.type === 'income' ? '收入' : '支出'}

【你的任务】
请智能推断以下信息（以JSON格式返回，无需解释）：

1. **金额(amount)** - 这是最重要的字段！
   - 从OCR文本中提取实际支付金额
   - 优先识别：实付金额、实收金额、合计、总计、小计、应付金额、支付金额
   - 排除：订单号（通常是8-10位数字）、商品编号、单号、流水号
   - 排除：优惠金额、折扣金额、税额
   - 如果后端已正确提取（amount > 0且合理），返回后端的值
   - 如果后端未提取到或明显错误，你必须从文本中重新提取
   - 返回纯数字，不要单位（如：7.19、25.62、123.5）
   - 如果实在提取不到，返回0

2. **备注(remark)** - 提取小票上的商品信息
   - 如果是餐饮：提取菜品名（如"红烧鸡腿、素菜"）
   - 如果是超市：提取商品名（如"可乐、薯片、面包"，最多3个，用顿号分隔）
   - 如果是其他：提取关键消费内容
   - 如果实在没有：留空字符串""

4. **分类优化(categoryName)** - 根据商家和内容智能判断
   支出分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他
   收入分类：工资/兼职/奖金/红包/退款/报销/投资/礼金/出售/其他

【返回格式】
{"amount":0,"remark":"","merchant":"","categoryName":""}

注意：
- amount是核心，必须尽力从文本中提取正确的实付金额
- 如果后端提取的金额明显错误（如561元但文本中实付7.19元），你必须纠正
- remark也很重要，必须尽力提取有价值的信息
- 如果某个字段无法优化，返回空字符串""（amount返回0）
- 不要编造信息，不确定就留空`;
    
    // 调用 DeepSeek API
    let aiResult = { remark: '', merchant: '', categoryName: '' };
    
    try {
      console.log('📤 [AI增强] 调用 DeepSeek chat.completions.create...');
      
      const completion = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const aiResponse = completion.choices[0]?.message?.content || '';
      console.log('📥 [AI增强] DeepSeek 响应:', aiResponse);
      
      // 写入日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `\n=== ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `DeepSeek响应: ${aiResponse}\n`);
      
      // 解析 JSON
      try {
        let jsonStr = null;
        const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = aiResponse.indexOf('{');
          const lastBrace = aiResponse.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = aiResponse.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          aiResult = JSON.parse(jsonStr);
        }
      } catch (error) {
        console.warn('⚠️ AI 响应解析失败:', error.message);
      }
      
    } catch (aiError) {
      console.error('❌ [AI增强] DeepSeek 调用失败:', aiError.message);
      
      // 写入错误日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `\n=== ERROR ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `错误: ${aiError.message}\n`);
      fs.appendFileSync('/tmp/ai-enhance-debug.log', `堆栈: ${aiError.stack}\n`);
    }
    
    // 合并结果
    const finalResult = {
      ...baseInfo,
      // 【修改】AI 提取的金额优先（如果 AI 提取到了且大于0）
      amount: (aiResult.amount && aiResult.amount > 0) ? aiResult.amount : baseInfo.amount,
      remark: aiResult.remark || baseInfo.remark || '',
      merchant: aiResult.merchant || baseInfo.merchant || '',
      categoryName: aiResult.categoryName || baseInfo.categoryName || '其他'
    };
    
    // 根据分类名称匹配分类ID
    finalResult.categoryId = getCategoryIdByName(finalResult.categoryName, finalResult.type);
    
    console.log('✅ [AI增强] 完成');
    console.log('后端金额:', baseInfo.amount, 'AI金额:', aiResult.amount, '最终金额:', finalResult.amount);
    
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
    
    // 检查 DeepSeek 是否可用
    if (!deepseekClient) {
      console.log('⚠️ DeepSeek API 不可用，返回前端原始数据');
      return res.json({
        success: true,
        data: baseInfo,
        aiEnabled: false
      });
    }
    
    console.log('📤 [AI增强-语音] 开始调用 DeepSeek API...');
    
    // 构建提示词
    const systemPrompt = `你是一个智能记账助手，擅长从语音文本中提取账单信息。你必须严格按照JSON格式返回结果，不要有任何额外的解释文字。`;
    
    const userPrompt = `

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

1. **金额(amount)** - 这是最重要的字段！
   - 从语音文本中提取金额数字
   - 支持中文数字：三、三十六、一百二十三、三块五等
   - 支持阿拉伯数字：3、36、123、3.5等
   - 支持各种表达：三块钱、36元、一百二十三块、三块五毛等
   - 如果前端已正确提取（amount > 0），返回前端的值
   - 如果前端未提取到（amount = 0），你必须从文本中提取
   - 返回纯数字，不要单位（如：3、36、123.5）
   - 如果实在提取不到，返回0

2. **备注(remark)** - 提取用户说的关键信息
   - **不要过度推理**：用户说什么就记录什么，不要猜测用户的意图
   - 如果用户说"滴滴打车"，备注就是"滴滴打车"，不要推理成"上班通勤"
   - 如果用户说"麦当劳吃汉堡"，备注就是"汉堡"
   - 如果用户说"买了一件衣服"，备注就是"衣服"
   - 提取用户明确说出的消费内容，不要添加额外信息
   - 如果实在没有：留空字符串""

3. **商家/来源优化(merchant)** - 仅在前端识别不准确时优化
   支出：识别知名品牌（星巴克、麦当劳、海底捞、美团、饿了么等）
   收入：识别具体来源（公司名、平台名等）
   - 如果前端已正确识别，返回原值
   - 如果识别不出，返回空字符串""

4. **分类优化(categoryName)** - 根据商家和内容智能判断
   支出分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他
   收入分类：工资/兼职/奖金/红包/退款/报销/投资/礼金/出售/其他

【返回格式】
{"amount":0,"remark":"","merchant":"","categoryName":""}

注意：
- amount是核心，必须尽力从文本中提取金额
- 中文数字转换示例：三→3、三十六→36、一百二十三→123、三块五→3.5
- remark也很重要，必须尽力提取有价值的信息
- 如果某个字段无法优化，返回空字符串""（amount返回0）
- 不要编造信息，不确定就留空`;
    
    // 调用 DeepSeek API
    let aiResult = { remark: '', merchant: '', categoryName: '' };
    
    try {
      console.log('📤 [AI增强-语音] 调用 DeepSeek chat.completions.create...');
      
      const completion = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const aiResponse = completion.choices[0]?.message?.content || '';
      console.log('📥 [AI增强-语音] DeepSeek 响应:', aiResponse);
      
      // 写入日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `\n=== ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `DeepSeek响应: ${aiResponse}\n`);
      
      // 解析 JSON
      try {
        let jsonStr = null;
        const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = aiResponse.indexOf('{');
          const lastBrace = aiResponse.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = aiResponse.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          aiResult = JSON.parse(jsonStr);
        }
      } catch (error) {
        console.warn('⚠️ AI 响应解析失败:', error.message);
      }
      
    } catch (aiError) {
      console.error('❌ [AI增强-语音] DeepSeek 调用失败:', aiError.message);
      
      // 写入错误日志
      const fs = require('fs');
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `\n=== ERROR ${new Date().toISOString()} ===\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `错误: ${aiError.message}\n`);
      fs.appendFileSync('/tmp/ai-enhance-voice-debug.log', `堆栈: ${aiError.stack}\n`);
    }
    
    // 合并结果
    const finalResult = {
      ...baseInfo,
      // AI 提取的金额优先（如果 AI 提取到了且大于0）
      amount: (aiResult.amount && aiResult.amount > 0) ? aiResult.amount : baseInfo.amount,
      remark: aiResult.remark || baseInfo.remark || '',
      merchant: aiResult.merchant || baseInfo.merchant || '',
      categoryName: aiResult.categoryName || baseInfo.categoryName || '其他'
    };
    
    // 根据分类名称匹配分类ID
    finalResult.categoryId = getCategoryIdByName(finalResult.categoryName, finalResult.type);
    
    console.log('✅ [AI增强-语音] 完成，最终金额:', finalResult.amount);
    
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
