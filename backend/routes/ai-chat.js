/**
 * AI 财务助手对话接口
 * 基于用户真实账单数据提供财务分析和建议
 * 使用智谱 AI GLM-4-Flash 模型
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const OpenAI = require('openai');

// 初始化智谱 AI 客户端
let zhipuClient = null;

try {
  const apiKey = process.env.ZHIPU_API_KEY;
  
  if (apiKey) {
    const fetch = require('node-fetch');
    const { FormData } = require('formdata-node');
    global.FormData = FormData;
    
    zhipuClient = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      fetch: fetch
    });
    console.log('✅ AI财务助手 - 智谱AI初始化成功');
  } else {
    console.warn('⚠️ AI财务助手 - 智谱AI API Key未配置');
  }
} catch (error) {
  console.warn('⚠️ AI财务助手 - 智谱AI初始化失败:', error.message);
}

/**
 * POST /api/ai-chat
 * AI财务助手对话
 */
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.userId || req.openid;
    
    if (!question) {
      return res.json({
        success: false,
        message: '请输入问题'
      });
    }
    
    if (!userId) {
      return res.json({
        success: false,
        message: '请先登录'
      });
    }
    
    // 检查今日使用次数（每天限制10次）
    const today = new Date().toISOString().split('T')[0];
    const usageCount = await db.query(
      `SELECT COUNT(*) as count FROM ai_chat_usage 
       WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, today]
    );
    
    const todayCount = usageCount[0]?.count || 0;
    const dailyLimit = 10;
    
    if (todayCount >= dailyLimit) {
      return res.json({
        success: false,
        message: `今日咨询次数已用完（${dailyLimit}/${dailyLimit}次）💤\n明天0点重置，期待与你再次相遇~`,
        remainingCount: 0
      });
    }
    
    // 检查智谱 AI 是否可用
    if (!zhipuClient) {
      return res.json({
        success: false,
        message: 'AI服务暂时不可用'
      });
    }
    
    console.log('📤 [AI财务助手] 用户问题:', question);
    
    // 1. 查询用户最近3个月的账单数据
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
    
    const bills = await db.query(
      `SELECT * FROM bills 
       WHERE user_id = ? AND date >= ? 
       ORDER BY date DESC`,
      [userId, threeMonthsAgoStr]
    );
    
    console.log(`📊 查询到 ${bills.length} 笔账单`);
    
    // 2. 统计数据
    const stats = {
      totalExpense: 0,
      totalIncome: 0,
      categoryStats: {},
      monthlyStats: {},
      billCount: bills.length
    };
    
    bills.forEach(bill => {
      const amount = parseFloat(bill.amount);
      const dateStr = bill.date instanceof Date 
        ? bill.date.toISOString().split('T')[0] 
        : bill.date;
      const month = dateStr.substring(0, 7); // YYYY-MM
      
      if (bill.type === 'expense') {
        stats.totalExpense += amount;
        
        // 按分类统计
        const category = bill.category_name || '其他';
        stats.categoryStats[category] = (stats.categoryStats[category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      
      // 按月统计
      if (!stats.monthlyStats[month]) {
        stats.monthlyStats[month] = { expense: 0, income: 0 };
      }
      if (bill.type === 'expense') {
        stats.monthlyStats[month].expense += amount;
      } else {
        stats.monthlyStats[month].income += amount;
      }
    });
    
    // 找出支出最多的分类（前3名）
    const topCategories = Object.entries(stats.categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => `${name}(${amount.toFixed(2)}元)`)
      .join('、');
    
    // 计算月均支出
    const monthCount = Object.keys(stats.monthlyStats).length || 1;
    const avgMonthlyExpense = (stats.totalExpense / monthCount).toFixed(2);
    
    console.log('📊 统计数据:', {
      totalExpense: stats.totalExpense.toFixed(2),
      totalIncome: stats.totalIncome.toFixed(2),
      topCategories,
      avgMonthlyExpense
    });
    
    // 3. 构建prompt
    const systemPrompt = `你是一个专业、友好的AI财务顾问助手，名字叫"小财"。你的任务是：
1. 用简洁、友好的语气回答用户的财务问题
2. 基于用户的真实账单数据给出分析和建议
3. 如果用户问的问题与财务无关，礼貌地引导回财务话题
4. 回答要具体、实用，避免空洞的建议
5. 适当使用emoji让回答更生动
6. 回答控制在200字以内
7. 直接回答，不要加"小财："等前缀`;

    const userPrompt = `【用户问题】
${question}

【用户最近3个月的财务数据】
- 总支出：${stats.totalExpense.toFixed(2)}元
- 总收入：${stats.totalIncome.toFixed(2)}元
- 账单笔数：${stats.billCount}笔
- 月均支出：${avgMonthlyExpense}元
- 支出最多的分类：${topCategories || '暂无数据'}

【按月统计】
${Object.entries(stats.monthlyStats).map(([month, data]) => 
  `${month}: 支出${data.expense.toFixed(2)}元，收入${data.income.toFixed(2)}元`
).join('\n')}`;
    
    // 4. 调用智谱 AI
    let aiAnswer = '抱歉，我现在有点忙 😅 请稍后再试~';
    
    try {
      console.log('📤 [AI财务助手] 调用智谱AI...');
      
      const completion = await zhipuClient.chat.completions.create({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log('📥 [AI财务助手] 智谱AI响应:', response);
      
      if (response.trim()) {
        aiAnswer = response.trim();
      } else {
        console.warn('⚠️ [AI财务助手] AI响应为空');
      }
      
    } catch (aiError) {
      console.error('❌ [AI财务助手] 调用失败:', aiError.message);
      aiAnswer = '抱歉，我现在有点忙，请稍后再试 😅';
    }
    
    // 记录使用次数
    try {
      await db.query(
        `INSERT INTO ai_chat_usage (user_id, question, created_at) VALUES (?, ?, NOW())`,
        [userId, question]
      );
    } catch (err) {
      console.error('记录使用次数失败:', err);
    }
    
    res.json({
      success: true,
      answer: aiAnswer,
      stats: {
        totalExpense: stats.totalExpense.toFixed(2),
        totalIncome: stats.totalIncome.toFixed(2),
        billCount: stats.billCount
      },
      remainingCount: dailyLimit - todayCount - 1
    });
    
  } catch (error) {
    console.error('❌ [AI财务助手] 失败:', error);
    
    res.json({
      success: false,
      message: error.message || '服务异常，请稍后重试'
    });
  }
});

module.exports = router;
