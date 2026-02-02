/**
 * 微信云开发 AI+ 工具函数
 */

// AI Agent 配置
const AI_CONFIG = {
  botId: 'agent-xiaopiaoshi-2end0lcd9c419f',
  env: 'cloud1-8gxevfq393690dfe'
}

/**
 * 发送消息到 AI Agent
 * @param {string} message - 用户消息
 * @param {string} threadId - 会话 ID（可选）
 * @returns {Promise<Object>} - 返回完整响应和事件流
 */
export async function sendMessageToAI(message, threadId = null) {
  try {
    // 生成唯一 ID
    const generateId = () => {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // 如果没有 threadId，生成一个新的
    if (!threadId) {
      threadId = generateId()
    }

    const runId = generateId()
    const msgId = generateId()

    // 调用 AI+ 能力
    const res = await wx.cloud.extend.AI.bot.sendMessage({
      data: {
        botId: AI_CONFIG.botId,
        threadId: threadId,
        runId: runId,
        messages: [
          { id: msgId, role: 'user', content: message }
        ],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {}
      }
    })

    return {
      threadId,
      runId,
      eventStream: res.eventStream
    }
  } catch (error) {
    console.error('发送消息到 AI 失败:', error)
    throw error
  }
}

/**
 * 处理 AI 响应事件流
 * @param {AsyncIterator} eventStream - 事件流
 * @param {Function} onDelta - 接收增量文本的回调
 * @param {Function} onError - 错误回调
 * @param {Function} onFinish - 完成回调
 * @returns {Promise<string>} - 返回完整响应文本
 */
export async function processAIResponse(eventStream, onDelta, onError, onFinish) {
  let fullText = ''

  try {
    for await (let event of eventStream) {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'TEXT_MESSAGE_CONTENT':
          fullText += data.delta
          if (onDelta) {
            onDelta(data.delta, fullText)
          }
          break

        case 'RUN_ERROR':
          console.error('AI 运行出错:', data.message)
          if (onError) {
            onError(data.message)
          }
          break

        case 'RUN_FINISHED':
          if (onFinish) {
            onFinish(fullText)
          }
          break
      }
    }
  } catch (error) {
    console.error('处理 AI 响应失败:', error)
    if (onError) {
      onError(error.message)
    }
    throw error
  }

  return fullText
}

/**
 * 简化的 AI 对话函数（一次性获取完整响应）
 * @param {string} message - 用户消息
 * @param {string} threadId - 会话 ID（可选）
 * @returns {Promise<Object>} - 返回 { text, threadId }
 */
export async function chatWithAI(message, threadId = null) {
  const { threadId: newThreadId, eventStream } = await sendMessageToAI(message, threadId)
  
  let fullText = ''
  for await (let event of eventStream) {
    const data = JSON.parse(event.data)
    if (data.type === 'TEXT_MESSAGE_CONTENT') {
      fullText += data.delta
    } else if (data.type === 'RUN_ERROR') {
      throw new Error(data.message)
    }
  }

  return {
    text: fullText,
    threadId: newThreadId
  }
}
