const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 简单验证（生产环境应该使用加密密码）
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        token,
        message: '登录成功'
      });
    } else {
      res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 获取统计数据 - 添加缓存（30秒）
router.get('/stats', cacheMiddleware(30000), async (req, res) => {
  try {
    // 总用户数
    const userCountResult = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCountResult[0].count;
    
    // 今日新增用户
    const todayNewResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'
    );
    const todayNew = todayNewResult[0].count;
    
    // 本周新增用户
    const weekNewResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    );
    const weekNew = weekNewResult[0].count;
    
    // 本月新增用户
    const monthNewResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())'
    );
    const monthNew = monthNewResult[0].count;
    
    // 总账单数
    const billCountResult = await db.query('SELECT COUNT(*) as count FROM bills');
    const totalBills = billCountResult[0].count;
    
    // 今日活跃用户
    const todayActiveResult = await db.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM bills WHERE DATE(date) = CURDATE()'
    );
    const todayActive = todayActiveResult[0].count;
    
    // 总收入金额
    const totalIncomeResult = await db.query(
      'SELECT SUM(amount) as total FROM bills WHERE type = "income"'
    );
    const totalIncome = totalIncomeResult[0].total || 0;
    
    // 总支出金额
    const totalExpenseResult = await db.query(
      'SELECT SUM(amount) as total FROM bills WHERE type = "expense"'
    );
    const totalExpense = totalExpenseResult[0].total || 0;
    
    res.json({
      success: true,
      data: {
        totalUsers,
        todayNew,
        weekNew,
        monthNew,
        totalBills,
        todayActive,
        totalIncome: parseFloat(totalIncome).toFixed(2),
        totalExpense: parseFloat(totalExpense).toFixed(2)
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.json({
      success: false,
      message: error.message || '获取统计数据失败'
    });
  }
});

// 获取用户增长趋势
router.get('/stats/user-growth', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await db.query(`
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `, [parseInt(days)]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户增长趋势失败:', error);
    res.json({
      success: false,
      message: error.message || '获取用户增长趋势失败'
    });
  }
});

// 获取收支统计
router.get('/stats/income-expense', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await db.query(`
      SELECT 
        DATE(date) as day,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM bills 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(date)
      ORDER BY day ASC
    `, [parseInt(days)]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取收支统计失败:', error);
    res.json({
      success: false,
      message: error.message || '获取收支统计失败'
    });
  }
});

// 获取分类统计
router.get('/stats/category', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        category_name,
        COUNT(*) as count,
        SUM(amount) as total
      FROM bills 
      WHERE type = 'expense' AND category_name IS NOT NULL
      GROUP BY category_name
      ORDER BY total DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.json({
      success: false,
      message: error.message || '获取分类统计失败'
    });
  }
});

// 获取数据趋势（最近7天的账单数量）
router.get('/stats/trend', async (req, res) => {
  try {
    // 获取最近7天的账单数量统计
    const trendResult = await db.query(`
      SELECT 
        DATE(date) as day,
        COUNT(*) as count
      FROM bills 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(date)
      ORDER BY day ASC
    `);
    
    // 生成最近7天的日期数组
    const days = [];
    const counts = [];
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 查找该日期的数据
      const dayData = trendResult.find(item => {
        const itemDate = new Date(item.day).toISOString().split('T')[0];
        return itemDate === dateStr;
      });
      
      days.push(dayNames[date.getDay()]);
      counts.push(dayData ? dayData.count : 0);
    }
    
    res.json({
      success: true,
      data: {
        days,
        counts
      }
    });
  } catch (error) {
    console.error('获取数据趋势失败:', error);
    res.json({
      success: false,
      message: error.message || '获取数据趋势失败'
    });
  }
});

// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, nickname, phone, status, platform, source } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const params = [];
    
    if (nickname) {
      whereClause += ' AND u.nickname LIKE ?';
      params.push(`%${nickname}%`);
    }
    
    if (phone) {
      whereClause += ' AND u.phone LIKE ?';
      params.push(`%${phone}%`);
    }
    
    if (platform) {
      whereClause += ' AND u.platform = ?';
      params.push(platform);
    }
    
    if (source) {
      whereClause += ' AND u.source = ?';
      params.push(source);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM users u WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].count;
    
    // 获取列表（包含账单数、总金额、积分等信息）
    const list = await db.query(
      `SELECT 
        u.*,
        COUNT(DISTINCT b.id) as bill_count,
        COALESCE(SUM(CASE WHEN b.type = 'expense' THEN b.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN b.type = 'income' THEN b.amount ELSE 0 END), 0) as total_income,
        COALESCE(p.points, 0) as points
      FROM users u
      LEFT JOIN bills b ON u.id = b.user_id
      LEFT JOIN user_points p ON u.id = p.user_id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC 
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list,
        total
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取用户列表失败'
    });
  }
});

// 获取平台统计
router.get('/stats/platform', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        platform,
        COUNT(*) as count
      FROM users 
      WHERE platform IS NOT NULL
      GROUP BY platform
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取平台统计失败:', error);
    res.json({
      success: false,
      message: error.message || '获取平台统计失败'
    });
  }
});

// 获取来源统计
router.get('/stats/source', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        source,
        COUNT(*) as count
      FROM users 
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取来源统计失败:', error);
    res.json({
      success: false,
      message: error.message || '获取来源统计失败'
    });
  }
});

// 获取渠道统计
router.get('/stats/channel', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        channel,
        COUNT(*) as count
      FROM users 
      WHERE channel IS NOT NULL AND channel != ''
      GROUP BY channel
      ORDER BY count DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取渠道统计失败:', error);
    res.json({
      success: false,
      message: error.message || '获取渠道统计失败'
    });
  }
});

// 获取用户详情
router.get('/users/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 用户基本信息
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userResult.length === 0) {
      return res.json({ success: false, message: '用户不存在' });
    }
    const user = userResult[0];
    
    // 统计数据
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as bill_count,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
      FROM bills WHERE user_id = ?
    `, [id]);
    const stats = statsResult[0];
    
    // 积分信息
    const pointsResult = await db.query('SELECT points FROM user_points WHERE user_id = ?', [id]);
    const points = pointsResult[0]?.points || 0;
    
    // 最近账单
    const recentBills = await db.query(
      'SELECT * FROM bills WHERE user_id = ? ORDER BY create_time DESC LIMIT 10',
      [id]
    );
    
    // 积分历史
    const pointsHistory = await db.query(
      'SELECT * FROM points_history WHERE user_id = ? ORDER BY create_time DESC LIMIT 10',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          ...stats,
          points
        },
        recentBills,
        pointsHistory
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.json({
      success: false,
      message: error.message || '获取用户详情失败'
    });
  }
});

// 调整用户积分
router.post('/users/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;
    
    if (!points || !reason) {
      return res.json({ success: false, message: '参数不完整' });
    }
    
    // 检查用户是否存在
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userResult.length === 0) {
      return res.json({ success: false, message: '用户不存在' });
    }
    
    // 更新或插入积分
    await db.query(`
      INSERT INTO user_points (user_id, points) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE points = points + ?
    `, [id, points, points]);
    
    // 记录积分历史
    await db.query(
      'INSERT INTO points_history (user_id, points, reason) VALUES (?, ?, ?)',
      [id, points, reason]
    );
    
    res.json({
      success: true,
      message: '积分调整成功'
    });
  } catch (error) {
    console.error('调整积分失败:', error);
    res.json({
      success: false,
      message: error.message || '调整积分失败'
    });
  }
});

// 导出用户数据
router.get('/users/export', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT 
        u.id,
        u.nickname,
        u.phone,
        u.created_at,
        COUNT(DISTINCT b.id) as bill_count,
        COALESCE(SUM(CASE WHEN b.type = 'expense' THEN b.amount ELSE 0 END), 0) as total_expense,
        COALESCE(p.points, 0) as points
      FROM users u
      LEFT JOIN bills b ON u.id = b.user_id
      LEFT JOIN user_points p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('导出用户数据失败:', error);
    res.json({
      success: false,
      message: error.message || '导出用户数据失败'
    });
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 删除用户的所有账单
    await db.query('DELETE FROM bills WHERE user_id = ?', [id]);
    
    // 删除用户
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.json({
      success: false,
      message: error.message || '删除用户失败'
    });
  }
});

// 获取账单列表
router.get('/bills', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      userId, 
      category, 
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const params = [];
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (category) {
      whereClause += ' AND category_name = ?';
      params.push(category);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }
    
    if (minAmount) {
      whereClause += ' AND amount >= ?';
      params.push(parseFloat(minAmount));
    }
    
    if (maxAmount) {
      whereClause += ' AND amount <= ?';
      params.push(parseFloat(maxAmount));
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM bills WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].count;
    
    // 获取列表
    const list = await db.query(
      `SELECT * FROM bills WHERE ${whereClause} ORDER BY create_time DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list,
        total
      }
    });
  } catch (error) {
    console.error('获取账单列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取账单列表失败'
    });
  }
});

// 获取账单详情
router.get('/bills/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 账单信息
    const billResult = await db.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (billResult.length === 0) {
      return res.json({ success: false, message: '账单不存在' });
    }
    const bill = billResult[0];
    
    // 用户信息
    const userResult = await db.query('SELECT id, nickname, phone FROM users WHERE id = ?', [bill.user_id]);
    const user = userResult[0] || null;
    
    res.json({
      success: true,
      data: {
        bill,
        user
      }
    });
  } catch (error) {
    console.error('获取账单详情失败:', error);
    res.json({
      success: false,
      message: error.message || '获取账单详情失败'
    });
  }
});

// 导出账单数据
router.get('/bills/export', async (req, res) => {
  try {
    const { 
      userId, 
      category, 
      type,
      startDate,
      endDate
    } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (category) {
      whereClause += ' AND category_name = ?';
      params.push(category);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }
    
    const bills = await db.query(
      `SELECT * FROM bills WHERE ${whereClause} ORDER BY create_time DESC LIMIT 10000`,
      params
    );
    
    res.json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('导出账单数据失败:', error);
    res.json({
      success: false,
      message: error.message || '导出账单数据失败'
    });
  }
});

// 删除账单
router.delete('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM bills WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除账单失败:', error);
    res.json({
      success: false,
      message: error.message || '删除账单失败'
    });
  }
});

// 获取系统日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    // 检查logs表是否存在
    try {
      const countResult = await db.query('SELECT COUNT(*) as count FROM logs');
      const total = countResult[0]?.count || 0;
      
      // 注意：MySQL不支持OFFSET使用占位符，需要直接拼接
      const list = await db.query(
        `SELECT * FROM logs ORDER BY create_time DESC LIMIT ${limit} OFFSET ${offset}`
      );
      
      res.json({
        success: true,
        data: {
          list,
          total
        }
      });
    } catch (tableError) {
      // 如果logs表不存在，返回空数据
      console.error('[日志查询] 表查询错误:', tableError.message);
      res.json({
        success: true,
        data: {
          list: [],
          total: 0
        }
      });
    }
  } catch (error) {
    console.error('[日志查询] 外层错误:', error);
    res.json({
      success: true,
      data: {
        list: [],
        total: 0
      }
    });
  }
});

// ========== 积分系统管理 ==========

// 获取用户积分列表
router.get('/points/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, nickname } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const params = [];
    
    if (nickname) {
      whereClause += ' AND u.nickname LIKE ?';
      params.push(`%${nickname}%`);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM users u WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].count;
    
    // 获取列表
    const list = await db.query(
      `SELECT 
        u.id,
        u.nickname,
        u.phone,
        COALESCE(p.points, 0) as points,
        COALESCE(SUM(ph.points), 0) as total_earned
      FROM users u
      LEFT JOIN user_points p ON u.id = p.user_id
      LEFT JOIN points_history ph ON u.id = ph.user_id AND ph.points > 0
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY p.points DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list,
        total
      }
    });
  } catch (error) {
    console.error('获取用户积分列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取用户积分列表失败'
    });
  }
});

// 获取积分发放记录
router.get('/points/history', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, userId } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '1=1';
    const params = [];
    
    if (userId) {
      whereClause += ' AND ph.user_id = ?';
      params.push(userId);
    }
    
    // 获取总数
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM points_history ph WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].count;
    
    // 获取列表
    const list = await db.query(
      `SELECT 
        ph.*,
        u.nickname,
        u.phone
      FROM points_history ph
      LEFT JOIN users u ON ph.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ph.create_time DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        list,
        total
      }
    });
  } catch (error) {
    console.error('获取积分历史失败:', error);
    res.json({
      success: false,
      message: error.message || '获取积分历史失败'
    });
  }
});

// 手动调整积分
router.post('/points/adjust', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    if (!userId || !points || !reason) {
      return res.json({ success: false, message: '参数不完整' });
    }
    
    // 检查用户是否存在
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userResult.length === 0) {
      return res.json({ success: false, message: '用户不存在' });
    }
    
    // 更新或插入积分
    await db.query(`
      INSERT INTO user_points (user_id, points) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE points = points + ?
    `, [userId, points, points]);
    
    // 记录积分历史
    await db.query(
      'INSERT INTO points_history (user_id, points, reason) VALUES (?, ?, ?)',
      [userId, points, reason]
    );
    
    res.json({
      success: true,
      message: '积分调整成功'
    });
  } catch (error) {
    console.error('调整积分失败:', error);
    res.json({
      success: false,
      message: error.message || '调整积分失败'
    });
  }
});

// 获取意见反馈列表
router.get('/feedback', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    // 获取反馈列表
    const feedbackList = await db.query(
      `SELECT id, user_id, content, images, user_info, created_at 
       FROM feedback 
       ORDER BY created_at DESC 
       LIMIT ${limit} OFFSET ${offset}`
    );
    
    // 获取总数
    const countResult = await db.query('SELECT COUNT(*) as total FROM feedback');
    
    // 处理数据
    const processedList = feedbackList.map(item => {
      let images = [];
      let userInfo = null;
      
      try {
        if (item.images) {
          const imagesStr = typeof item.images === 'string' ? item.images : item.images.toString();
          if (imagesStr.trim()) {
            images = JSON.parse(imagesStr);
          }
        }
      } catch (e) {
        console.error('解析images失败:', e);
      }
      
      try {
        if (item.user_info) {
          const userInfoStr = typeof item.user_info === 'string' ? item.user_info : item.user_info.toString();
          if (userInfoStr.trim()) {
            userInfo = JSON.parse(userInfoStr);
          }
        }
      } catch (e) {
        console.error('解析user_info失败:', e);
      }
      
      return {
        ...item,
        images,
        user_info: userInfo
      };
    });
    
    res.json({
      success: true,
      data: processedList,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: limit
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取反馈列表失败'
    });
  }
});

// 删除反馈
router.delete('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM feedback WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除反馈失败:', error);
    res.json({
      success: false,
      message: error.message || '删除反馈失败'
    });
  }
});

// ========== APP版本管理 ==========

// 获取版本列表
router.get('/app-versions', async (req, res) => {
  try {
    const versions = await db.query(`
      SELECT 
        id,
        platform,
        version,
        update_content as updateContent,
        package_size as packageSize,
        download_url as downloadUrl,
        is_force as isForce,
        DATE_FORMAT(update_time, '%Y-%m-%d') as updateTime,
        created_at
      FROM app_versions
      ORDER BY created_at DESC
    `);
    
    // 解析JSON字段
    const processedVersions = versions.map(v => ({
      ...v,
      updateContent: typeof v.updateContent === 'string' ? JSON.parse(v.updateContent) : v.updateContent,
      isForce: Boolean(v.isForce)
    }));
    
    res.json({
      success: true,
      data: processedVersions
    });
  } catch (error) {
    console.error('获取版本列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取版本列表失败'
    });
  }
});

// 创建新版本
router.post('/app-versions', async (req, res) => {
  try {
    const { platform, version, updateContent, packageSize, downloadUrl, isForce } = req.body;
    
    if (!platform || !version || !updateContent || !packageSize || !downloadUrl) {
      return res.json({
        success: false,
        message: '参数不完整'
      });
    }
    
    // 检查版本号是否已存在
    const existing = await db.query(
      'SELECT id FROM app_versions WHERE platform = ? AND version = ?',
      [platform, version]
    );
    
    if (existing.length > 0) {
      return res.json({
        success: false,
        message: '该版本号已存在'
      });
    }
    
    await db.query(
      `INSERT INTO app_versions 
       (platform, version, update_content, package_size, download_url, is_force, update_time) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [platform, version, JSON.stringify(updateContent), packageSize, downloadUrl, isForce ? 1 : 0]
    );
    
    res.json({
      success: true,
      message: '发布成功'
    });
  } catch (error) {
    console.error('创建版本失败:', error);
    res.json({
      success: false,
      message: error.message || '创建版本失败'
    });
  }
});

// 更新版本
router.put('/app-versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version, updateContent, packageSize, downloadUrl, isForce } = req.body;
    
    if (!version || !updateContent || !packageSize || !downloadUrl) {
      return res.json({
        success: false,
        message: '参数不完整'
      });
    }
    
    await db.query(
      `UPDATE app_versions 
       SET version = ?, update_content = ?, package_size = ?, download_url = ?, is_force = ?, update_time = NOW()
       WHERE id = ?`,
      [version, JSON.stringify(updateContent), packageSize, downloadUrl, isForce ? 1 : 0, id]
    );
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新版本失败:', error);
    res.json({
      success: false,
      message: error.message || '更新版本失败'
    });
  }
});

// 删除版本
router.delete('/app-versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM app_versions WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除版本失败:', error);
    res.json({
      success: false,
      message: error.message || '删除版本失败'
    });
  }
});

// 切换强制更新
router.put('/app-versions/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const { isForce } = req.body;
    
    await db.query(
      'UPDATE app_versions SET is_force = ? WHERE id = ?',
      [isForce ? 1 : 0, id]
    );
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('切换强制更新失败:', error);
    res.json({
      success: false,
      message: error.message || '切换强制更新失败'
    });
  }
});

// 上传APK文件
router.post('/upload-apk', async (req, res) => {
  try {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../uploads/apk');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 配置multer
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `qiannaqule-${timestamp}${ext}`);
      }
    });
    
    const upload = multer({
      storage: storage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname).toLowerCase() === '.apk') {
          cb(null, true);
        } else {
          cb(new Error('只能上传APK文件'));
        }
      }
    }).single('file');
    
    upload(req, res, function (err) {
      if (err) {
        return res.json({
          success: false,
          message: err.message || '上传失败'
        });
      }
      
      if (!req.file) {
        return res.json({
          success: false,
          message: '没有文件上传'
        });
      }
      
      // 计算文件大小
      const fileSizeInMB = (req.file.size / (1024 * 1024)).toFixed(2);
      
      res.json({
        success: true,
        url: `https://api.qiannaqule.top/uploads/apk/${req.file.filename}`,
        size: `${fileSizeInMB}MB`,
        message: '上传成功'
      });
    });
  } catch (error) {
    console.error('上传APK失败:', error);
    res.json({
      success: false,
      message: error.message || '上传APK失败'
    });
  }
});

// ========== 安卓二维码管理 ==========

// 上传安卓二维码
router.post('/upload-android-qrcode', async (req, res) => {
  try {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../uploads/qrcode');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 配置multer
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `android-qrcode-${timestamp}${ext}`);
      }
    });
    
    const upload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('只能上传JPG或PNG图片'));
        }
      }
    }).single('file');
    
    upload(req, res, async function (err) {
      if (err) {
        return res.json({
          success: false,
          message: err.message || '上传失败'
        });
      }
      
      if (!req.file) {
        return res.json({
          success: false,
          message: '没有文件上传'
        });
      }
      
      const qrcodeUrl = `https://api.qiannaqule.top/uploads/qrcode/${req.file.filename}`;
      
      // 保存到数据库
      try {
        // 先检查是否已有记录
        const existing = await db.query('SELECT id FROM android_qrcode LIMIT 1');
        
        if (existing.length > 0) {
          // 更新现有记录
          await db.query(
            'UPDATE android_qrcode SET qrcode_url = ?, updated_at = NOW() WHERE id = ?',
            [qrcodeUrl, existing[0].id]
          );
        } else {
          // 插入新记录
          await db.query(
            'INSERT INTO android_qrcode (qrcode_url, created_at, updated_at) VALUES (?, NOW(), NOW())',
            [qrcodeUrl]
          );
        }
        
        res.json({
          success: true,
          url: qrcodeUrl,
          message: '上传成功'
        });
      } catch (dbError) {
        console.error('保存二维码URL失败:', dbError);
        res.json({
          success: false,
          message: '保存失败'
        });
      }
    });
  } catch (error) {
    console.error('上传安卓二维码失败:', error);
    res.json({
      success: false,
      message: error.message || '上传失败'
    });
  }
});

// 获取安卓二维码
router.get('/android-qrcode', async (req, res) => {
  try {
    const result = await db.query('SELECT qrcode_url as qrcodeUrl FROM android_qrcode ORDER BY updated_at DESC LIMIT 1');
    
    if (result.length > 0) {
      res.json({
        success: true,
        data: {
          qrcodeUrl: result[0].qrcodeUrl
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          qrcodeUrl: null
        }
      });
    }
  } catch (error) {
    console.error('获取安卓二维码失败:', error);
    res.json({
      success: false,
      message: error.message || '获取失败'
    });
  }
});

module.exports = router;
