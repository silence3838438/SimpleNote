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
 * 如果有 token 则验证，没有 token 则返回需要登录错误
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '请先登录后再使用此功能',
        needLogin: true
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    
    next();
  } catch (error) {
    console.error('Token 验证失败:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期，请重新登录',
        needLogin: true
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌，请重新登录',
      needLogin: true
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
