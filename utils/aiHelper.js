/**
 * AI助手工具类 - 集成微信云开发 AI+ 能力
 * 用于智能识别小票信息（拍照识别和语音识别）
 */

// 你的 Agent ID
const AGENT_ID = 'agent-xiaopiaoshi-2end0lcd9c419f'

/**
 * 调用 AI Agent 识别小票信息
 * @param {string} userMessage - 用户消息（OCR识别的文本或语音识别的文本）
 * @param {string} imageUrl - 可选的图片URL（如果有的话）
 * @returns {Promise<Object>} 解析后的账单信息
 */
export async function recognizeBillWithAI(userMessage, imageUrl = null) {
  try {
    console.log('开始调用 AI Agent 识别小票:', userMessage)
    
    // 构建消息内容
    const messages = [
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: buildPrompt(userMessage, imageUrl)
      }
    ]
    
    // 调用 AI Agent
    const res = await wx.cloud.extend.AI.bot.sendMessage({
      data: {
        botId: AGENT_ID,
        threadId: `thread-${Date.now()}`,
        runId: `run-${Date.now()}`,
        messages: messages,
        tools: [],
        context: [],
        state: {},
        forwardedProps: {}
      }
    })
    
    // 收集完整响应
    let fullText = ''
    for await (let event of res.eventStream) {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'TEXT_MESSAGE_CONTENT':
          fullText += data.delta
          console.log('AI 响应片段:', data.delta)
          break
          
        case 'RUN_ERROR':
          console.error('AI 运行出错:', data.message)
          throw new Error(data.message)
          
        case 'RUN_FINISHED':
          console.log('AI 识别完成')
          break
      }
    }
    
    console.log('AI 完整响应:', fullText)
    
    // 解析 AI 返回的结果
    return parseAIResponse(fullText)
    
  } catch (error) {
    console.error('AI 识别失败:', error)
    throw error
  }
}

/**
 * 构建发送给 AI 的提示词
 */
function buildPrompt(userMessage, imageUrl) {
  let prompt = `你是一个智能记账助手，请从以下信息中提取账单数据。

用户输入: ${userMessage}

请严格按照以下 JSON 格式返回结果（只返回JSON，不要其他文字）：
{
  "type": "expense 或 income",
  "amount": 数字金额,
  "merchant": "商家名称或来源",
  "categoryName": "分类名称",
  "date": "YYYY-MM-DD格式日期",
  "remark": "备注信息"
}

分类规则：
- 支出分类：餐饮、交通、购物、娱乐、住房、医疗、通讯、服饰、美容、学习、社交、其他
- 收入分类：工资、兼职、奖金、红包、退款、报销、投资、其他

识别规则：
1. 优先识别金额（支持"元"、"块"、"¥"等表达）
2. 识别商家名称（如"海底捞"、"滴滴"等）
3. 根据关键词智能匹配分类
4. 日期默认今天，支持"昨天"、"前天"
5. 判断是收入还是支出（包含"工资"、"收入"、"赚"等为收入）

请开始识别：`

  return prompt
}

/**
 * 解析 AI 返回的响应
 */
function parseAIResponse(aiText) {
  try {
    // 尝试提取 JSON
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 返回格式错误')
    }
    
    const result = JSON.parse(jsonMatch[0])
    
    // 验证必要字段
    if (!result.amount || result.amount <= 0) {
      throw new Error('未识别到有效金额')
    }
    
    // 设置默认值
    result.type = result.type || 'expense'
    result.merchant = result.merchant || ''
    result.categoryName = result.categoryName || '其他'
    result.date = result.date || new Date().toISOString().split('T')[0]
    result.remark = result.remark || ''
    
    // 根据分类名称匹配分类ID
    result.categoryId = getCategoryIdByName(result.categoryName, result.type)
    
    console.log('解析后的账单信息:', result)
    return result
    
  } catch (error) {
    console.error('解析 AI 响应失败:', error)
    throw new Error('AI 识别结果解析失败')
  }
}

/**
 * 根据分类名称获取分类ID
 */
function getCategoryIdByName(categoryName, type) {
  // 支出分类映射
  const expenseCategories = {
    '餐饮': 1,
    '交通': 2,
    '购物': 3,
    '娱乐': 4,
    '住房': 5,
    '医疗': 6,
    '通讯': 7,
    '服饰': 8,
    '美容': 9,
    '学习': 10,
    '社交': 11,
    '其他': 12
  }
  
  // 收入分类映射
  const incomeCategories = {
    '工资': 101,
    '兼职': 102,
    '奖金': 103,
    '红包': 104,
    '退款': 105,
    '报销': 106,
    '投资': 107,
    '其他': 108
  }
  
  const categories = type === 'income' ? incomeCategories : expenseCategories
  return categories[categoryName] || (type === 'income' ? 108 : 12)
}

export default {
  recognizeBillWithAI
}
