const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * 账号绑定路由
 * 用于小程序和APP账号的手动关联
 */

// 绑定手机号（小程序用户绑定手机号）
router.post('/bind-phone', authMiddleware, async (req, res) => {
  try {
    const { phone, code } = req.body;
    const userId = req.userId;
    
    if (!phone || !code) {
      return res.json({
        success: false,
        message: '请填写手机号和验证码'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 验证验证码
    const codes = await db.query(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND type = ? AND expire_time > NOW()',
      [phone, code, 'bind']
    );

    if (codes.length === 0) {
      return res.json({
        success: false,
        message: '验证码错误或已过期'
      });
    }

    // 检查当前用户是否已绑定手机号
    const currentUser = await db.query(
      'SELECT phone FROM users WHERE id = ?',
      [userId]
    );

    if (currentUser.length === 0) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    if (currentUser[0].phone) {
      return res.json({
        success: false,
        message: '该账号已绑定手机号，无法重复绑定'
      });
    }

    // 检查手机号是否已被其他账号绑定
    const existingUsers = await db.query(
      'SELECT id, openid, phone FROM users WHERE phone = ? AND id != ?',
      [phone, userId]
    );

    if (existingUsers.length > 0) {
      // 手机号已被其他账号使用，需要合并账号
      const targetUser = existingUsers[0];
      
      // 如果目标账号有openid（小程序账号），不允许合并
      if (targetUser.openid) {
        return res.json({
          success: false,
          message: '该手机号已被其他微信账号绑定，无法关联'
        });
      }

      // 目标账号是APP账号（只有手机号），可以合并
      // 将当前用户的openid更新到目标账号
      await db.query(
        'UPDATE users SET openid = ?, session_key = (SELECT session_key FROM users WHERE id = ?) WHERE id = ?',
        [currentUser[0].openid, userId, targetUser.id]
      );

      // 将当前用户的所有数据迁移到目标账号
      await db.query('UPDATE bills SET user_id = ? WHERE user_id = ?', [targetUser.id, userId]);
      await db.query('UPDATE budgets SET user_id = ? WHERE user_id = ?', [targetUser.id, userId]);
      await db.query('UPDATE reminders SET user_id = ? WHERE user_id = ?', [targetUser.id, userId]);
      await db.query('UPDATE user_points SET user_id = ? WHERE user_id = ?', [targetUser.id, userId]);
      await db.query('UPDATE points_history SET user_id = ? WHERE user_id = ?', [targetUser.id, userId]);

      // 删除当前用户
      await db.query('DELETE FROM users WHERE id = ?', [userId]);

      // 删除已使用的验证码
      await db.query('DELETE FROM verification_codes WHERE phone = ?', [phone]);

      // 生成新的JWT token（使用合并后的账号ID）
      const token = jwt.sign(
        { userId: targetUser.id, phone, openid: currentUser[0].openid },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: '账号已成功关联',
        merged: true,
        token,
        data: {
          userId: targetUser.id,
          phone
        }
      });
    }

    // 手机号未被使用，直接绑定
    await db.query(
      'UPDATE users SET phone = ? WHERE id = ?',
      [phone, userId]
    );

    // 删除已使用的验证码
    await db.query('DELETE FROM verification_codes WHERE phone = ?', [phone]);

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: {
        phone
      }
    });

  } catch (error) {
    console.error('绑定手机号失败:', error);
    res.json({
      success: false,
      message: error.message || '绑定失败'
    });
  }
});

// 获取账号绑定状态
router.get('/binding-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const users = await db.query(
      'SELECT phone, openid, app_openid, unionid FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        hasPhone: !!user.phone,
        hasWechat: !!user.openid,
        hasAppWechat: !!user.app_openid,
        hasUnionid: !!user.unionid,
        phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
      }
    });

  } catch (error) {
    console.error('获取绑定状态失败:', error);
    res.json({
      success: false,
      message: error.message || '获取失败'
    });
  }
});

// 解绑手机号
router.post('/unbind-phone', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // 检查用户是否有其他登录方式
    const users = await db.query(
      'SELECT phone, openid, app_openid, apple_id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 如果只有手机号登录方式，不允许解绑
    if (!user.openid && !user.app_openid && !user.apple_id) {
      return res.json({
        success: false,
        message: '至少需要保留一种登录方式'
      });
    }

    // 解绑手机号
    await db.query(
      'UPDATE users SET phone = NULL WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '手机号已解绑'
    });

  } catch (error) {
    console.error('解绑手机号失败:', error);
    res.json({
      success: false,
      message: error.message || '解绑失败'
    });
  }
});

module.exports = router;
