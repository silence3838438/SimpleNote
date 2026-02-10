const express = require('express');
const router = express.Router();
const db = require('../db');

// 账单管理路由
router.post('/', async (req, res) => {
  try {
    const { action, data } = req.body;
    const userId = req.userId; // 从 JWT 中间件获取
    
    if (!userId) {
      return res.json({
        success: false,
        message: '请先登录后再使用此功能',
        needLogin: true
      });
    }

    switch (action) {
      case 'add':
        return await addBill(req, res, userId, data);
      case 'list':
        return await getBills(req, res, userId, data);
      case 'update':
        return await updateBill(req, res, userId, data);
      case 'delete':
        return await deleteBill(req, res, userId, data);
      case 'sync':
        return await syncBills(req, res, userId, data);
      case 'getBudget':
        return await getBudget(req, res, userId);
      case 'setBudget':
        return await setBudget(req, res, userId, data);
      case 'getReminder':
        return await getReminder(req, res, userId);
      case 'setReminder':
        return await setReminder(req, res, userId, data);
      case 'saveReminderSubscription':
        return await saveReminderSubscription(req, res, userId, data);
      case 'getRedPacketCount':
        return await getRedPacketCount(req, res, userId);
      case 'grabRedPacket':
        return await grabRedPacket(req, res, userId, data);
      case 'getPoints':
        return await getPoints(req, res, userId);
      case 'addPoints':
        return await addPoints(req, res, userId, data);
      case 'getPointsHistory':
        return await getPointsHistory(req, res, userId, data);
      case 'syncPoints':
        return await syncPoints(req, res, userId, data);
      case 'getUserInfo':
        return await getUserInfo(req, res, userId);
      case 'updateUserInfo':
        return await updateUserInfo(req, res, userId, data);
      default:
        res.json({ success: false, message: '未知操作' });
    }
  } catch (error) {
    console.error('账单操作失败:', error);
    res.json({ success: false, message: error.message });
  }
});

// 添加账单
async function addBill(req, res, userId, billData) {
  // 确保所有字段都不是 undefined，转换为 null
  const type = billData.type || 'expense';
  const amount = parseFloat(billData.amount) || 0;
  const merchant = billData.merchant || '';
  const date = billData.date || new Date().toISOString().split('T')[0];
  const categoryId = billData.categoryId ?? null;
  const categoryName = billData.categoryName || '其他';
  // 兼容 remark 和 note 两种字段名
  const note = billData.note || billData.remark || '';
  
  // 使用前端传来的时间戳,如果没有则使用当前时间
  const createTime = billData.createTime || Date.now();
  
  const result = await db.query(
    'INSERT INTO bills (user_id, type, amount, merchant, date, category_id, category_name, note, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, type, amount, merchant, date, categoryId, categoryName, note, createTime]
  );
  
  res.json({
    success: true,
    _id: result.insertId,
    id: result.insertId,
    message: '添加成功'
  });
}

// 获取账单列表
async function getBills(req, res, userId, params = {}) {
  const { startDate, endDate, limit = 100, skip = 0 } = params;
  
  // 确保 limit 和 skip 是安全的整数
  const safeLimit = Math.max(1, Math.min(1000, parseInt(limit) || 100));
  const safeSkip = Math.max(0, parseInt(skip) || 0);
  
  let query = 'SELECT * FROM bills WHERE user_id = ?';
  let queryParams = [userId];
  
  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    queryParams.push(startDate, endDate);
  }
  
  // LIMIT 和 OFFSET 直接拼接（已经过安全验证）
  query += ` ORDER BY date DESC, create_time DESC LIMIT ${safeLimit} OFFSET ${safeSkip}`;
  
  const bills = await db.query(query, queryParams);
  
  // 转换数据格式，确保前端兼容
  const formattedBills = bills.map(bill => {
    // 转换日期格式: Date对象 -> YYYY-MM-DD
    let dateStr = bill.date;
    if (bill.date instanceof Date) {
      const year = bill.date.getFullYear();
      const month = String(bill.date.getMonth() + 1).padStart(2, '0');
      const day = String(bill.date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else if (typeof bill.date === 'string' && bill.date.includes('T')) {
      dateStr = bill.date.split('T')[0];
    }
    
    // create_time现在是BIGINT类型,直接使用
    const createTimeStamp = bill.create_time || null;
    
    return {
      id: bill.id,
      _id: bill.id, // 云端ID
      type: bill.type || 'expense',
      amount: parseFloat(bill.amount) || 0,
      merchant: bill.merchant || '',
      date: dateStr,
      categoryId: bill.category_id,
      categoryName: bill.category_name || '其他',
      remark: bill.note || '', // 前端使用 remark 字段
      note: bill.note || '', // 同时保留 note 字段
      createTime: createTimeStamp, // 返回时间戳
      synced: true // 从云端获取的数据标记为已同步
    };
  });
  
  res.json({
    success: true,
    data: formattedBills,
    total: formattedBills.length
  });
}

// 更新账单
async function updateBill(req, res, userId, data) {
  const { _id, ...updateData } = data;
  
  // 转换字段名：驼峰 -> 下划线
  const dbFields = {};
  if (updateData.type !== undefined) dbFields.type = updateData.type;
  if (updateData.amount !== undefined) dbFields.amount = parseFloat(updateData.amount) || 0;
  if (updateData.merchant !== undefined) dbFields.merchant = updateData.merchant;
  if (updateData.date !== undefined) dbFields.date = updateData.date;
  if (updateData.categoryId !== undefined) dbFields.category_id = updateData.categoryId;
  if (updateData.categoryName !== undefined) dbFields.category_name = updateData.categoryName;
  if (updateData.note !== undefined) dbFields.note = updateData.note;
  if (updateData.remark !== undefined) dbFields.note = updateData.remark;
  
  const fields = Object.keys(dbFields).map(key => `${key} = ?`).join(', ');
  const values = Object.values(dbFields);
  values.push(_id, userId);
  
  await db.query(
    `UPDATE bills SET ${fields}, update_time = NOW() WHERE id = ? AND user_id = ?`,
    values
  );
  
  res.json({ success: true, message: '更新成功' });
}

// 删除账单
async function deleteBill(req, res, userId, data) {
  await db.query('DELETE FROM bills WHERE id = ? AND user_id = ?', [data._id, userId]);
  res.json({ success: true, message: '删除成功' });
}

// 同步账单
async function syncBills(req, res, userId, data) {
  const { bills } = data;
  
  if (!bills || bills.length === 0) {
    return res.json({ success: true, message: '无数据需要同步' });
  }
  
  for (const bill of bills) {
    const type = bill.type || 'expense';
    const amount = parseFloat(bill.amount) || 0;
    const merchant = bill.merchant || '';
    // 转换日期格式：ISO 8601 -> YYYY-MM-DD
    let date = bill.date || new Date().toISOString().split('T')[0];
    if (date.includes('T')) {
      date = date.split('T')[0];
    }
    const categoryId = bill.categoryId ?? bill.category_id ?? null;
    const categoryName = bill.categoryName || bill.category_name || '其他';
    const note = bill.note || bill.remark || '';
    // 转换创建时间格式
    let createTime = bill.createTime || bill.create_time || new Date();
    if (typeof createTime === 'string' && createTime.includes('T')) {
      createTime = createTime.replace('T', ' ').replace('Z', '');
    }
    
    await db.query(
      'INSERT INTO bills (user_id, type, amount, merchant, date, category_id, category_name, note, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, type, amount, merchant, date, categoryId, categoryName, note, createTime]
    );
  }
  
  res.json({ success: true, count: bills.length, message: `成功同步${bills.length}条数据` });
}

// 获取预算
async function getBudget(req, res, userId) {
  const result = await db.query('SELECT amount FROM budgets WHERE user_id = ?', [userId]);
  
  res.json({
    success: true,
    budget: result.length > 0 ? parseFloat(result[0].amount) : 6000
  });
}

// 设置预算
async function setBudget(req, res, userId, data) {
  const amount = parseFloat(data.amount) || 0;
  const existing = await db.query('SELECT id FROM budgets WHERE user_id = ?', [userId]);
  
  if (existing.length > 0) {
    await db.query('UPDATE budgets SET amount = ?, update_time = NOW() WHERE user_id = ?', [amount, userId]);
  } else {
    await db.query('INSERT INTO budgets (user_id, amount, create_time) VALUES (?, ?, NOW())', [userId, amount]);
  }
  
  res.json({ success: true, message: '预算设置成功' });
}

// 获取提醒设置
async function getReminder(req, res, userId) {
  const result = await db.query('SELECT * FROM reminders WHERE user_id = ?', [userId]);
  
  res.json({
    success: true,
    reminder: result.length > 0 ? result[0] : { enabled: false, time: '21:00' }
  });
}

// 设置提醒
async function setReminder(req, res, userId, data) {
  const existing = await db.query('SELECT id FROM reminders WHERE user_id = ?', [userId]);
  
  if (existing.length > 0) {
    await db.query('UPDATE reminders SET enabled = ?, time = ?, update_time = NOW() WHERE user_id = ?', 
      [data.enabled, data.time, userId]);
  } else {
    await db.query('INSERT INTO reminders (user_id, enabled, time, create_time) VALUES (?, ?, ?, NOW())', 
      [userId, data.enabled, data.time]);
  }
  
  res.json({ success: true, message: data.enabled ? '提醒设置成功' : '提醒已关闭' });
}

// 保存提醒订阅信息
async function saveReminderSubscription(req, res, userId, data) {
  const { subscribed, templateId, reminderTime } = data;
  
  const existing = await db.query('SELECT id FROM reminders WHERE user_id = ?', [userId]);
  
  if (existing.length > 0) {
    await db.query(
      'UPDATE reminders SET enabled = ?, time = ?, template_id = ?, update_time = NOW() WHERE user_id = ?',
      [subscribed, reminderTime, templateId, userId]
    );
  } else {
    await db.query(
      'INSERT INTO reminders (user_id, enabled, time, template_id, create_time) VALUES (?, ?, ?, ?, NOW())',
      [userId, subscribed, reminderTime, templateId]
    );
  }
  
  res.json({ success: true, message: '订阅信息保存成功' });
}

// 获取抢红包次数
async function getRedPacketCount(req, res, userId) {
  const result = await db.query(
    'SELECT morning_count, afternoon_count, last_grab_time FROM red_packet_records WHERE user_id = ? AND DATE(last_grab_time) = CURDATE()',
    [userId]
  );
  
  if (result.length > 0) {
    res.json({
      success: true,
      morningCount: parseInt(result[0].morning_count) || 0,
      afternoonCount: parseInt(result[0].afternoon_count) || 0,
      lastGrabTime: result[0].last_grab_time ? new Date(result[0].last_grab_time).getTime() : 0
    });
  } else {
    res.json({
      success: true,
      morningCount: 0,
      afternoonCount: 0,
      lastGrabTime: 0
    });
  }
}

// 抢红包
async function grabRedPacket(req, res, userId, data) {
  const { isAfternoon, points, reason } = data;
  const pointsToAdd = parseInt(points) || 0;
  
  // 获取今日记录
  const existing = await db.query(
    'SELECT id, morning_count, afternoon_count FROM red_packet_records WHERE user_id = ? AND DATE(last_grab_time) = CURDATE()',
    [userId]
  );
  
  let morningCount = 0;
  let afternoonCount = 0;
  
  if (existing.length > 0) {
    morningCount = parseInt(existing[0].morning_count) || 0;
    afternoonCount = parseInt(existing[0].afternoon_count) || 0;
    
    // 更新次数
    if (isAfternoon) {
      afternoonCount += 1;
    } else {
      morningCount += 1;
    }
    
    await db.query(
      'UPDATE red_packet_records SET morning_count = ?, afternoon_count = ?, last_grab_time = NOW() WHERE id = ?',
      [morningCount, afternoonCount, existing[0].id]
    );
  } else {
    // 创建新记录
    if (isAfternoon) {
      afternoonCount = 1;
    } else {
      morningCount = 1;
    }
    
    await db.query(
      'INSERT INTO red_packet_records (user_id, morning_count, afternoon_count, last_grab_time) VALUES (?, ?, ?, NOW())',
      [userId, morningCount, afternoonCount]
    );
  }
  
  // 如果有积分，添加积分
  if (pointsToAdd > 0) {
    // 先添加积分
    const current = await db.query('SELECT points FROM user_points WHERE user_id = ?', [userId]);
    const currentPoints = current.length > 0 ? (parseInt(current[0].points) || 0) : 0;
    const newPoints = currentPoints + pointsToAdd;
    
    // 更新积分
    if (current.length > 0) {
      await db.query('UPDATE user_points SET points = ?, update_time = NOW() WHERE user_id = ?', [newPoints, userId]);
    } else {
      await db.query('INSERT INTO user_points (user_id, points, create_time) VALUES (?, ?, NOW())', [userId, newPoints]);
    }
    
    // 记录积分历史
    await db.query(
      'INSERT INTO points_history (user_id, points, reason, metadata, create_time) VALUES (?, ?, ?, ?, NOW())',
      [userId, pointsToAdd, reason, JSON.stringify({ type: 'red_packet' })]
    );
  }
  
  res.json({
    success: true,
    morningCount,
    afternoonCount,
    lastGrabTime: Date.now()
  });
}

// 获取积分
async function getPoints(req, res, userId) {
  const result = await db.query('SELECT points FROM user_points WHERE user_id = ?', [userId]);
  
  res.json({
    success: true,
    points: result.length > 0 ? parseInt(result[0].points) || 0 : 0
  });
}

// 添加积分
async function addPoints(req, res, userId, data) {
  const { points, reason, metadata = {} } = data;
  const pointsToAdd = parseInt(points) || 0;
  
  // 获取当前积分
  const current = await db.query('SELECT points FROM user_points WHERE user_id = ?', [userId]);
  const currentPoints = current.length > 0 ? (parseInt(current[0].points) || 0) : 0;
  const newPoints = currentPoints + pointsToAdd;
  
  // 更新积分
  if (current.length > 0) {
    await db.query('UPDATE user_points SET points = ?, update_time = NOW() WHERE user_id = ?', [newPoints, userId]);
  } else {
    await db.query('INSERT INTO user_points (user_id, points, create_time) VALUES (?, ?, NOW())', [userId, newPoints]);
  }
  
  // 记录积分历史
  await db.query(
    'INSERT INTO points_history (user_id, points, reason, metadata, create_time) VALUES (?, ?, ?, ?, NOW())',
    [userId, pointsToAdd, reason, JSON.stringify(metadata)]
  );
  
  res.json({
    success: true,
    points: newPoints,
    addedPoints: pointsToAdd,
    message: '积分添加成功'
  });
}

// 获取积分历史
async function getPointsHistory(req, res, userId, params = {}) {
  const { limit = 50, skip = 0 } = params;
  
  // 确保 limit 和 skip 是安全的整数
  const safeLimit = Math.max(1, Math.min(1000, parseInt(limit) || 50));
  const safeSkip = Math.max(0, parseInt(skip) || 0);
  
  const history = await db.query(
    `SELECT * FROM points_history WHERE user_id = ? ORDER BY create_time DESC LIMIT ${safeLimit} OFFSET ${safeSkip}`,
    [userId]
  );
  
  // 转换数据格式
  const formattedHistory = history.map(item => ({
    id: item.id,
    points: parseInt(item.points) || 0,
    reason: item.reason || '',
    createTime: item.create_time,
    metadata: item.metadata ? JSON.parse(item.metadata) : {}
  }));
  
  res.json({
    success: true,
    data: formattedHistory
  });
}

// 同步积分
async function syncPoints(req, res, userId, data) {
  const { pointsHistory } = data;
  
  if (!pointsHistory || pointsHistory.length === 0) {
    return res.json({ success: true, message: '无积分数据需要同步' });
  }
  
  let totalPoints = 0;
  for (const item of pointsHistory) {
    const points = parseInt(item.points) || 0;
    const reason = item.reason || '';
    const metadata = item.metadata || {};
    const createTime = item.createTime || new Date();
    
    await db.query(
      'INSERT INTO points_history (user_id, points, reason, metadata, create_time) VALUES (?, ?, ?, ?, ?)',
      [userId, points, reason, JSON.stringify(metadata), createTime]
    );
    totalPoints += points;
  }
  
  // 更新总积分
  const current = await db.query('SELECT points FROM user_points WHERE user_id = ?', [userId]);
  const currentPoints = current.length > 0 ? (parseInt(current[0].points) || 0) : 0;
  const newPoints = currentPoints + totalPoints;
  
  if (current.length > 0) {
    await db.query('UPDATE user_points SET points = ?, update_time = NOW() WHERE user_id = ?', [newPoints, userId]);
  } else {
    await db.query('INSERT INTO user_points (user_id, points, create_time) VALUES (?, ?, NOW())', [userId, newPoints]);
  }
  
  res.json({ success: true, count: pointsHistory.length, message: `成功同步${pointsHistory.length}条积分记录` });
}

// 获取用户信息
async function getUserInfo(req, res, userId) {
  const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (result.length === 0) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  const user = result[0];
  res.json({
    success: true,
    userInfo: {
      nickName: user.nickname || '未设置',
      avatarUrl: user.avatar_url || '',
      isLogin: true
    }
  });
}

// 更新用户信息
async function updateUserInfo(req, res, userId, data) {
  const { nickName, avatarUrl } = data;
  
  await db.query(
    'UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?',
    [nickName, avatarUrl, userId]
  );
  
  res.json({ success: true, message: '用户信息更新成功' });
}

module.exports = router;
