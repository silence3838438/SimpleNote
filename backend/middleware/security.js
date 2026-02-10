const crypto = require('crypto');

// 加密密钥（与前端保持一致）
const AES_KEY = 'qiannaqule2024!@#$%^&*()_+key';
const SIGN_KEY = 'qiannaqule2024!@#$%^&*()_+sign';

/**
 * MD5 加密
 */
function md5(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 简单解密（XOR + Base64）
 */
function decrypt(encryptedData) {
  const decoded = Buffer.from(encryptedData, 'base64').toString();
  let decrypted = '';
  
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ AES_KEY.charCodeAt(i % AES_KEY.length);
    decrypted += String.fromCharCode(charCode);
  }
  
  return JSON.parse(decrypted);
}

/**
 * 简单加密（XOR + Base64）
 */
function encrypt(data) {
  const jsonStr = JSON.stringify(data);
  let encrypted = '';
  
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i) ^ AES_KEY.charCodeAt(i % AES_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }
  
  return Buffer.from(encrypted).toString('base64');
}

/**
 * 生成签名
 */
function generateSign(data, timestamp) {
  const keys = Object.keys(data).sort();
  const sortedData = {};
  keys.forEach(key => {
    sortedData[key] = data[key];
  });
  
  const str = JSON.stringify(sortedData) + timestamp + SIGN_KEY;
  return md5(str);
}

/**
 * 验证签名
 */
function verifySign(data, timestamp, sign) {
  const expectedSign = generateSign(data, timestamp);
  return sign === expectedSign;
}

/**
 * 验证时间戳（5分钟内有效）
 */
function verifyTimestamp(timestamp) {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  const maxDiff = 5 * 60 * 1000; // 5分钟
  return diff < maxDiff;
}

/**
 * 安全验证中间件
 */
const securityMiddleware = (req, res, next) => {
  try {
    // 如果请求头包含 X-Encrypted 标记，说明是加密请求
    const isEncrypted = req.headers['x-encrypted'] === 'true';
    
    if (!isEncrypted) {
      // 不加密的请求直接通过
      return next();
    }
    
    const { data: encryptedData, timestamp, sign } = req.body;
    
    // 验证必要字段
    if (!encryptedData || !timestamp || !sign) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的安全参数'
      });
    }
    
    // 验证时间戳
    if (!verifyTimestamp(timestamp)) {
      return res.status(401).json({
        success: false,
        message: '请求已过期，请重试'
      });
    }
    
    // 解密数据
    let decryptedData;
    try {
      decryptedData = decrypt(encryptedData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '数据解密失败'
      });
    }
    
    // 验证签名
    if (!verifySign(decryptedData, timestamp, sign)) {
      return res.status(401).json({
        success: false,
        message: '签名验证失败'
      });
    }
    
    // 将解密后的数据替换到 req.body
    req.body = decryptedData;
    
    // 标记响应需要加密
    req.needEncrypt = true;
    
    next();
  } catch (error) {
    console.error('安全验证失败:', error);
    res.status(500).json({
      success: false,
      message: '安全验证异常'
    });
  }
};

/**
 * 响应加密中间件
 */
const encryptResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // 如果请求需要加密响应
    if (req.needEncrypt) {
      const encryptedData = encrypt(data);
      return originalJson({
        data: encryptedData,
        encrypted: true
      });
    }
    
    // 否则正常返回
    return originalJson(data);
  };
  
  next();
};

module.exports = {
  securityMiddleware,
  encryptResponse,
  encrypt,
  decrypt,
  generateSign,
  verifySign,
  verifyTimestamp
};
