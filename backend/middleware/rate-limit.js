// 速率限制和安全检查中间件
const db = require('../db');

// 获取客户端真实IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
}

// 检查IP注册限制
async function checkIPLimit(req, res, next) {
  try {
    const ip = getClientIP(req);
    const { phone } = req.body;
    
    // 1. 检查IP今日注册次数（最多3次）
    const ipRegistrations = await db.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= CURDATE() 
       AND last_login_ip = ?`,
      [ip]
    );
    
    if (ipRegistrations[0].count >= 3) {
      return res.json({
        success: false,
        message: '该IP今日注册次数已达上限，请明天再试'
      });
    }
    
    // 2. 检查手机号是否已注册
    if (phone) {
      const phoneExists = await db.query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      
      if (phoneExists.length > 0) {
        return res.json({
          success: false,
          message: '该手机号已注册'
        });
      }
    }
    
    // 3. 检查手机号是否在黑名单
    if (phone) {
      const blacklist = await db.query(
        'SELECT * FROM phone_blacklist WHERE phone = ? AND is_active = 1',
        [phone]
      );
      
      if (blacklist.length > 0) {
        return res.json({
          success: false,
          message: '该手机号已被限制注册，请联系客服'
        });
      }
    }
    
    // 将IP附加到请求对象
    req.clientIP = ip;
    next();
    
  } catch (error) {
    console.error('IP限制检查失败:', error);
    // 检查失败不影响正常流程
    next();
  }
}

// 检查验证码发送频率
async function checkSMSLimit(req, res, next) {
  try {
    const ip = getClientIP(req);
    const { phone } = req.body;
    
    // 1. 检查IP今日发送次数（最多10次）
    const ipSMS = await db.query(
      `SELECT COUNT(*) as count FROM verification_codes 
       WHERE DATE(created_at) = CURDATE() 
       AND ip_address = ?`,
      [ip]
    );
    
    if (ipSMS[0].count >= 10) {
      return res.json({
        success: false,
        message: '该IP今日验证码发送次数已达上限'
      });
    }
    
    // 2. 检查手机号今日发送次数（最多5次）
    if (phone) {
      const phoneSMS = await db.query(
        `SELECT COUNT(*) as count FROM verification_codes 
         WHERE DATE(created_at) = CURDATE() 
         AND phone = ?`,
        [phone]
      );
      
      if (phoneSMS[0].count >= 5) {
        return res.json({
          success: false,
          message: '该手机号今日验证码发送次数已达上限'
        });
      }
    }
    
    // 3. 检查60秒内是否已发送
    if (phone) {
      const recentSMS = await db.query(
        `SELECT * FROM verification_codes 
         WHERE phone = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)`,
        [phone]
      );
      
      if (recentSMS.length > 0) {
        return res.json({
          success: false,
          message: '验证码发送过于频繁，请60秒后再试'
        });
      }
    }
    
    req.clientIP = ip;
    next();
    
  } catch (error) {
    console.error('短信限制检查失败:', error);
    next();
  }
}

module.exports = {
  checkIPLimit,
  checkSMSLimit,
  getClientIP
};
