// 简单的内存缓存中间件
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 缓存1分钟

/**
 * 缓存中间件 - 用于GET请求
 */
function cacheMiddleware(duration = CACHE_TTL) {
  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    // 重写res.json方法
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // 只缓存成功的响应
      if (data.success) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
      }
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// 每分钟清理一次过期缓存
setInterval(cleanExpiredCache, 60 * 1000);

/**
 * 清除指定key的缓存
 */
function clearCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  cacheMiddleware,
  clearCache
};
