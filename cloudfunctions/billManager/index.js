// 云函数：账单管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-8gxevfq393690dfe'
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event
  
  try {
    switch (action) {
      // 添加账单
      case 'add':
        return await addBill(wxContext.OPENID, data)
      
      // 获取账单列表
      case 'list':
        return await getBills(wxContext.OPENID, data)
      
      // 更新账单
      case 'update':
        return await updateBill(wxContext.OPENID, data)
      
      // 删除账单
      case 'delete':
        return await deleteBill(wxContext.OPENID, data)
      
      // 同步本地数据到云端
      case 'sync':
        return await syncBills(wxContext.OPENID, data)
      
      // 获取预算
      case 'getBudget':
        return await getBudget(wxContext.OPENID)
      
      // 设置预算
      case 'setBudget':
        return await setBudget(wxContext.OPENID, data)
      
      // 获取用户信息
      case 'getUserInfo':
        return await getUserInfo(wxContext.OPENID)
      
      // 更新用户信息
      case 'updateUserInfo':
        return await updateUserInfo(wxContext.OPENID, data)
      
      // 设置提醒
      case 'setReminder':
        return await setReminder(wxContext.OPENID, data)
      
      // 获取提醒设置
      case 'getReminder':
        return await getReminder(wxContext.OPENID)
      
      // 保存订阅消息订阅状态
      case 'saveReminderSubscription':
        return await saveReminderSubscription(wxContext.OPENID, data)
      
      // 获取积分信息
      case 'getPoints':
        return await getPoints(wxContext.OPENID)
      
      // 添加积分
      case 'addPoints':
        return await addPoints(wxContext.OPENID, data)
      
      // 同步积分到云端
      case 'syncPoints':
        return await syncPoints(wxContext.OPENID, data)
      
      // 获取积分历史
      case 'getPointsHistory':
        return await getPointsHistory(wxContext.OPENID, data)
      
      // 获取会员等级
      case 'getMemberLevel':
        return await getMemberLevel(wxContext.OPENID)
      
      // 获取抢红包次数
      case 'getRedPacketCount':
        return await getRedPacketCount(wxContext.OPENID)
      
      // 记录抢红包
      case 'grabRedPacket':
        return await grabRedPacket(wxContext.OPENID, data)
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { success: false, message: error.message }
  }
}

// 添加账单
async function addBill(openid, billData) {
  const result = await db.collection('bills').add({
    data: {
      ...billData,
      _openid: openid,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  
  return {
    success: true,
    _id: result._id,
    message: '添加成功'
  }
}

// 获取账单列表
async function getBills(openid, params = {}) {
  const { startDate, endDate, limit = 100, skip = 0 } = params
  
  let query = db.collection('bills').where({
    _openid: openid
  })
  
  // 日期筛选
  if (startDate && endDate) {
    query = query.where({
      date: _.gte(startDate).and(_.lte(endDate))
    })
  }
  
  const result = await query
    .orderBy('date', 'desc')
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: result.data,
    total: result.data.length
  }
}

// 更新账单
async function updateBill(openid, { _id, ...updateData }) {
  const result = await db.collection('bills').doc(_id).update({
    data: {
      ...updateData,
      updateTime: db.serverDate()
    }
  })
  
  return {
    success: true,
    message: '更新成功'
  }
}

// 删除账单
async function deleteBill(openid, { _id }) {
  const result = await db.collection('bills').doc(_id).remove()
  
  return {
    success: true,
    message: '删除成功'
  }
}

// 批量同步本地数据到云端
async function syncBills(openid, { bills }) {
  if (!bills || bills.length === 0) {
    return { success: true, message: '无数据需要同步' }
  }
  
  // 批量添加
  const promises = bills.map(bill => {
    return db.collection('bills').add({
      data: {
        ...bill,
        _openid: openid,
        createTime: bill.createTime ? new Date(bill.createTime) : db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  })
  
  await Promise.all(promises)
  
  return {
    success: true,
    count: bills.length,
    message: `成功同步${bills.length}条数据`
  }
}

// 获取预算
async function getBudget(openid) {
  const result = await db.collection('budgets')
    .where({
      _openid: openid
    })
    .get()
  
  if (result.data.length > 0) {
    return { 
      success: true, 
      budget: result.data[0].amount 
    }
  } else {
    // 返回默认预算
    return { 
      success: true, 
      budget: 6000 
    }
  }
}

// 设置预算
async function setBudget(openid, { amount }) {
  // 查询是否已存在预算记录
  const existResult = await db.collection('budgets')
    .where({
      _openid: openid
    })
    .get()
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await db.collection('budgets').doc(existResult.data[0]._id).update({
      data: {
        amount: amount,
        updateTime: db.serverDate()
      }
    })
  } else {
    // 创建新记录
    await db.collection('budgets').add({
      data: {
        _openid: openid,
        amount: amount,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  }
  
  return { 
    success: true, 
    message: '预算设置成功' 
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  const result = await db.collection('users')
    .where({
      _openid: openid
    })
    .get()
  
  if (result.data.length > 0) {
    return { 
      success: true, 
      userInfo: result.data[0]
    }
  } else {
    // 返回默认用户信息
    return { 
      success: true, 
      userInfo: {
        nickName: '记账达人',
        avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png'
      }
    }
  }
}

// 更新用户信息
async function updateUserInfo(openid, { nickName, avatarUrl }) {
  // 查询是否已存在用户记录
  const existResult = await db.collection('users')
    .where({
      _openid: openid
    })
    .get()
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await db.collection('users').doc(existResult.data[0]._id).update({
      data: {
        nickName: nickName,
        avatarUrl: avatarUrl,
        updateTime: db.serverDate()
      }
    })
  } else {
    // 创建新记录
    await db.collection('users').add({
      data: {
        _openid: openid,
        nickName: nickName,
        avatarUrl: avatarUrl,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  }
  
  return { 
    success: true, 
    message: '用户信息更新成功' 
  }
}

// 设置提醒
async function setReminder(openid, { enabled, time }) {
  // 查询是否已存在提醒记录
  const existResult = await db.collection('reminders')
    .where({
      _openid: openid
    })
    .get()
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await db.collection('reminders').doc(existResult.data[0]._id).update({
      data: {
        enabled: enabled,
        time: time,
        updateTime: db.serverDate()
      }
    })
  } else {
    // 创建新记录
    await db.collection('reminders').add({
      data: {
        _openid: openid,
        enabled: enabled,
        time: time,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  }
  
  return { 
    success: true, 
    message: enabled ? '提醒设置成功' : '提醒已关闭' 
  }
}

// 获取提醒设置
async function getReminder(openid) {
  const result = await db.collection('reminders')
    .where({
      _openid: openid
    })
    .get()
  
  if (result.data.length > 0) {
    return { 
      success: true, 
      reminder: result.data[0]
    }
  } else {
    // 返回默认设置
    return { 
      success: true, 
      reminder: {
        enabled: false,
        time: '21:00'
      }
    }
  }
}

// 保存订阅消息订阅状态
async function saveReminderSubscription(openid, { subscribed, templateId, reminderTime }) {
  try {
    console.log('开始保存订阅信息:', { openid, subscribed, templateId, reminderTime })
    
    // 统一使用 reminders 集合，保持与 getReminder 一致
    const existResult = await db.collection('reminders')
      .where({
        _openid: openid
      })
      .get()
    
    // 统一字段名：enabled 和 time
    const reminderData = {
      enabled: subscribed,
      time: reminderTime || '20:00',
      templateId: templateId,
      updateTime: db.serverDate()
    }
    
    console.log('提醒数据:', reminderData)
    
    if (existResult.data.length > 0) {
      // 更新现有记录
      console.log('更新现有提醒记录，ID:', existResult.data[0]._id)
      await db.collection('reminders').doc(existResult.data[0]._id).update({
        data: reminderData
      })
    } else {
      // 创建新记录
      console.log('创建新提醒记录')
      const addResult = await db.collection('reminders').add({
        data: {
          _openid: openid,
          ...reminderData,
          createTime: db.serverDate()
        }
      })
      console.log('创建成功，ID:', addResult._id)
    }
    
    console.log('提醒信息保存成功')
    return { success: true, message: '提醒信息保存成功' }
  } catch (error) {
    console.error('保存提醒信息失败:', error)
    return { success: false, message: error.message }
  }
}

// 获取积分信息
async function getPoints(openid) {
  const result = await db.collection('user_points')
    .where({
      _openid: openid
    })
    .get()
  
  if (result.data.length > 0) {
    return { 
      success: true, 
      points: result.data[0].totalPoints || 0,
      data: result.data[0]
    }
  } else {
    // 返回默认积分
    return { 
      success: true, 
      points: 0,
      data: {
        totalPoints: 0,
        todayPoints: 0,
        level: 1
      }
    }
  }
}

// 添加积分
async function addPoints(openid, { points, reason, metadata = {} }) {
  // 查询用户当前积分
  const existResult = await db.collection('user_points')
    .where({
      _openid: openid
    })
    .get()
  
  let newTotalPoints = points
  let recordId = null
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    const currentData = existResult.data[0]
    newTotalPoints = (currentData.totalPoints || 0) + points
    
    await db.collection('user_points').doc(currentData._id).update({
      data: {
        totalPoints: newTotalPoints,
        updateTime: db.serverDate()
      }
    })
    recordId = currentData._id
  } else {
    // 创建新记录
    const addResult = await db.collection('user_points').add({
      data: {
        _openid: openid,
        totalPoints: newTotalPoints,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    recordId = addResult._id
  }
  
  // 记录积分历史
  await db.collection('points_history').add({
    data: {
      _openid: openid,
      points: points,
      reason: reason,
      metadata: metadata,
      totalPoints: newTotalPoints,
      createTime: db.serverDate()
    }
  })
  
  return { 
    success: true, 
    totalPoints: newTotalPoints,
    addedPoints: points,
    message: '积分添加成功' 
  }
}

// 同步积分到云端
async function syncPoints(openid, { totalPoints, pointsHistory = [] }) {
  // 更新总积分
  const existResult = await db.collection('user_points')
    .where({
      _openid: openid
    })
    .get()
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    await db.collection('user_points').doc(existResult.data[0]._id).update({
      data: {
        totalPoints: totalPoints,
        updateTime: db.serverDate()
      }
    })
  } else {
    // 创建新记录
    await db.collection('user_points').add({
      data: {
        _openid: openid,
        totalPoints: totalPoints,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  }
  
  // 同步积分历史（只同步最近的记录）
  if (pointsHistory.length > 0) {
    const promises = pointsHistory.slice(0, 50).map(record => {
      return db.collection('points_history').add({
        data: {
          _openid: openid,
          points: record.points,
          reason: record.reason,
          totalPoints: record.totalPoints,
          createTime: record.timestamp ? new Date(record.timestamp) : db.serverDate()
        }
      })
    })
    
    await Promise.all(promises)
  }
  
  return { 
    success: true, 
    totalPoints: totalPoints,
    message: '积分同步成功' 
  }
}

// 获取积分历史
async function getPointsHistory(openid, { limit = 50, skip = 0 } = {}) {
  const result = await db.collection('points_history')
    .where({
      _openid: openid
    })
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: result.data,
    total: result.data.length
  }
}

// 获取会员等级
async function getMemberLevel(openid) {
  // 获取用户积分
  const pointsResult = await getPoints(openid)
  const totalPoints = pointsResult.points || 0
  
  // 会员等级配置
  const levels = [
    { level: 1, name: '青铜记账师', icon: '🥉', requiredPoints: 0 },
    { level: 2, name: '白银记账师', icon: '🥈', requiredPoints: 100 },
    { level: 3, name: '黄金记账师', icon: '🥇', requiredPoints: 300 },
    { level: 4, name: '铂金记账师', icon: '💎', requiredPoints: 600 },
    { level: 5, name: '钻石记账师', icon: '👑', requiredPoints: 1000 },
    { level: 6, name: '至尊记账师', icon: '⭐', requiredPoints: 2000 }
  ]
  
  // 计算当前等级
  let currentLevel = levels[0]
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalPoints >= levels[i].requiredPoints) {
      currentLevel = levels[i]
      break
    }
  }
  
  return {
    success: true,
    level: currentLevel,
    totalPoints: totalPoints
  }
}

// 获取抢红包次数
async function getRedPacketCount(openid) {
  const today = new Date().toDateString()
  
  const result = await db.collection('red_packet_records')
    .where({
      _openid: openid,
      date: today
    })
    .get()
  
  if (result.data.length > 0) {
    const record = result.data[0]
    return {
      success: true,
      morningCount: record.morningCount || 0,
      afternoonCount: record.afternoonCount || 0,
      lastGrabTime: record.lastGrabTime || 0,
      date: record.date
    }
  } else {
    return {
      success: true,
      morningCount: 0,
      afternoonCount: 0,
      lastGrabTime: 0,
      date: today
    }
  }
}

// 记录抢红包
async function grabRedPacket(openid, { isAfternoon, points, reason }) {
  const today = new Date().toDateString()
  const now = Date.now()
  
  // 查询今天的记录
  const existResult = await db.collection('red_packet_records')
    .where({
      _openid: openid,
      date: today
    })
    .get()
  
  let morningCount = 0
  let afternoonCount = 0
  
  if (existResult.data.length > 0) {
    // 更新现有记录
    const record = existResult.data[0]
    morningCount = record.morningCount || 0
    afternoonCount = record.afternoonCount || 0
    
    // 检查次数限制
    if (isAfternoon && afternoonCount >= 10) {
      return {
        success: false,
        message: '下午红包已抢完',
        morningCount: morningCount,
        afternoonCount: afternoonCount
      }
    }
    
    if (!isAfternoon && morningCount >= 10) {
      return {
        success: false,
        message: '上午红包已抢完',
        morningCount: morningCount,
        afternoonCount: afternoonCount
      }
    }
    
    // 检查时间间隔（3分钟 = 180000毫秒）
    const lastGrabTime = record.lastGrabTime || 0
    if (lastGrabTime > 0 && (now - lastGrabTime) >= 180000) {
      return {
        success: false,
        message: isAfternoon ? '明天再来' : '下午再来',
        morningCount: morningCount,
        afternoonCount: afternoonCount
      }
    }
    
    // 更新次数
    if (isAfternoon) {
      afternoonCount += 1
    } else {
      morningCount += 1
    }
    
    await db.collection('red_packet_records').doc(record._id).update({
      data: {
        morningCount: morningCount,
        afternoonCount: afternoonCount,
        lastGrabTime: now,
        updateTime: db.serverDate()
      }
    })
  } else {
    // 创建新记录
    if (isAfternoon) {
      afternoonCount = 1
    } else {
      morningCount = 1
    }
    
    await db.collection('red_packet_records').add({
      data: {
        _openid: openid,
        date: today,
        morningCount: morningCount,
        afternoonCount: afternoonCount,
        lastGrabTime: now,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  }
  
  // 如果是积分红包，添加积分
  if (points && points > 0) {
    await addPoints(openid, { points, reason })
  }
  
  return {
    success: true,
    morningCount: morningCount,
    afternoonCount: afternoonCount,
    lastGrabTime: now,
    message: '抢红包成功'
  }
}
