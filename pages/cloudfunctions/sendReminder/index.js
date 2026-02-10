// 云函数：发送记账提醒（定时任务）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('开始执行记账提醒推送任务')
    
    // 获取当前时间（北京时间 UTC+8）
    const now = new Date()
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const currentHour = beijingTime.getUTCHours()
    const currentMinute = beijingTime.getUTCMinutes()
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    console.log('当前时间（北京时间）:', currentTime)
    
    // 如果传入了testMode参数，立即推送给当前用户
    if (event.testMode) {
      console.log('测试模式：立即推送给当前用户（忽略防重复检查）')
      
      // 获取当前用户的openid
      const wxContext = cloud.getWXContext()
      const openid = wxContext.OPENID
      
      console.log('当前用户openid:', openid)
      
      // 统一使用 reminders 集合
      const subscription = await db.collection('reminders')
        .where({
          _openid: openid,
          enabled: true
        })
        .get()
      
      if (subscription.data.length > 0) {
        const result = await sendReminderMessage(subscription.data[0], true) // 传入 true 表示测试模式
        return {
          success: true,
          message: '测试推送完成',
          result
        }
      } else {
        return {
          success: false,
          message: '未找到订阅记录或未订阅'
        }
      }
    }
    
    // 获取所有已订阅的用户（统一使用 reminders 集合）
    const subscriptions = await db.collection('reminders')
      .where({
        enabled: true
      })
      .get()
    
    console.log(`找到 ${subscriptions.data.length} 个已订阅用户`)
    
    // 推送结果统计
    let successCount = 0
    let failCount = 0
    let skipCount = 0
    
    // 遍历所有订阅用户，检查是否需要推送
    for (const subscription of subscriptions.data) {
      try {
        // 统一使用 time 字段
        const reminderTime = subscription.time || '20:00'
        
        // 检查是否到了用户设定的提醒时间（允许15分钟误差）
        if (isTimeMatch(currentTime, reminderTime)) {
          console.log(`用户 ${subscription._openid} 的提醒时间已到: ${reminderTime}`)
          const result = await sendReminderMessage(subscription)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } else {
          skipCount++
        }
      } catch (error) {
        console.error(`推送失败 - openid: ${subscription._openid}`, error)
        failCount++
      }
    }
    
    console.log(`推送完成 - 成功: ${successCount}, 失败: ${failCount}, 跳过: ${skipCount}`)
    
    return {
      success: true,
      total: subscriptions.data.length,
      successCount,
      failCount,
      skipCount
    }
  } catch (error) {
    console.error('定时任务执行失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 检查时间是否匹配（当前时间在目标时间之后的10分钟内）
function isTimeMatch(currentTime, targetTime) {
  const [currentHour, currentMinute] = currentTime.split(':').map(v => parseInt(v))
  const [targetHour, targetMinute] = targetTime.split(':').map(v => parseInt(v))
  
  const currentTotalMinutes = currentHour * 60 + currentMinute
  const targetTotalMinutes = targetHour * 60 + targetMinute
  
  // 计算时间差（当前时间 - 目标时间）
  const diff = currentTotalMinutes - targetTotalMinutes
  
  // 如果当前时间在目标时间之后的0-10分钟内，则匹配
  // 例如：目标20:00，当前20:00-20:10之间都会推送
  // 配合5分钟触发间隔，确保在20:00、20:05、20:10中的某次推送
  return diff >= 0 && diff <= 10
}

// 发送订阅消息
async function sendReminderMessage(subscription, isTestMode = false) {
  try {
    // 检查今天是否已经推送过（测试模式下跳过此检查）
    if (!isTestMode) {
      const now = new Date()
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
      const today = beijingTime.toISOString().split('T')[0]
      const lastPushDate = subscription.lastPushDate || ''
      
      if (lastPushDate === today) {
        console.log(`今天已推送过 - openid: ${subscription._openid}`)
        return { success: true, skipped: true, message: '今天已推送' }
      }
    }
    
    // 获取当前时间，格式化为微信要求的格式（使用北京时间）
    const now = new Date()
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    // 统一使用 time 字段
    const timeStr = `${beijingTime.getUTCFullYear()}年${(beijingTime.getUTCMonth() + 1).toString().padStart(2, '0')}月${beijingTime.getUTCDate().toString().padStart(2, '0')}日 ${subscription.time || '20:00'}`
    
    const result = await cloud.openapi.subscribeMessage.send({
      touser: subscription._openid,
      page: 'pages/index/index', // 点击消息跳转的页面
      data: {
        time1: {
          value: timeStr
        },
        thing2: {
          value: '别忘了记录今天的收支哦~'
        }
      },
      templateId: subscription.templateId,
      miniprogramState: 'formal' // 正式版
    })
    
    // 更新最后推送日期（测试模式下不更新）
    if (!isTestMode) {
      const now = new Date()
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
      const today = beijingTime.toISOString().split('T')[0]
      // 统一使用 reminders 集合
      await db.collection('reminders')
        .where({
          _openid: subscription._openid
        })
        .update({
          data: {
            lastPushDate: today,
            lastPushTime: db.serverDate()
          }
        })
    }
    
    console.log(`推送成功 - openid: ${subscription._openid}`)
    
    // 返回简化的结果，避免 BigInt 序列化问题
    return { 
      success: true, 
      message: '推送成功',
      errCode: result.errCode || 0
    }
  } catch (error) {
    console.error(`推送失败 - openid: ${subscription._openid}`, error)
    
    // 如果是用户拒绝或订阅过期，更新订阅状态
    if (error.errCode === 43101 || error.errCode === 47003) {
      // 统一使用 reminders 集合和 enabled 字段
      await db.collection('reminders')
        .where({
          _openid: subscription._openid
        })
        .update({
          data: {
            enabled: false,
            updateTime: db.serverDate()
          }
        })
      console.log(`用户订阅已过期，已更新状态 - openid: ${subscription._openid}`)
    }
    
    return { 
      success: false, 
      error: error.message || '推送失败',
      errCode: error.errCode || -1
    }
  }
}
