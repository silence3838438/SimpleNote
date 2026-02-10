const jwt = require('jsonwebtoken');

/**
 * JWT 认证中间件
 * 从 Authorization header 中解析 token，验证并提取 userId
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从 header 中获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 提取 token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将 userId 添加到 request 对象
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    
    next();
  } catch (error) {
    console.error('Token 验证失败:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期，请重新登录'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }
};

/**
 * 可选的 JWT 认证中间件
 * 如果有 token 则验证并提取用户信息，没有 token 则继续执行（允许匿名访问）
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 没有 token，允许继续（匿名访问）
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.userId = null;
      req.openid = null;
      return next();
    }
    
    // 有 token，验证并提取用户信息
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    
    next();
  } catch (error) {
    console.error('Token 验证失败:', error.message);
    
    // Token 无效，但允许继续（降级为匿名访问）
    req.userId = null;
    req.openid = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
