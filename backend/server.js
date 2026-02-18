const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression'); // 响应压缩
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 启用响应压缩 - 减少带宽占用
app.use(compression());

// 中间件 - 更详细的CORS配置
app.use(cors({
  origin: '*', // 允许所有来源（开发环境）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 处理OPTIONS预检请求
app.options('*', cors());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 提供上传文件访问
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(uploadDir));

// 初始化数据库
const db = require('./db');
db.testConnection().then(success => {
  if (success) {
    db.initTables();
  }
});

// 中间件
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/auth');
const { securityMiddleware, encryptResponse } = require('./middleware/security');
const { cacheMiddleware } = require('./middleware/cache');

// 全局启用响应加密中间件
app.use(encryptResponse);

// 全局启用安全验证中间件（可选）
// app.use(securityMiddleware);

// 路由
const authRoutes = require('./routes/auth');
const billRoutes = require('./routes/bills');
const ocrRoutes = require('./routes/ocr');
const asrRoutes = require('./routes/asr');
const uploadRoutes = require('./routes/upload');
const appRoutes = require('./routes/app');
const adminRoutes = require('./routes/admin');
const aiEnhanceRoutes = require('./routes/ai-enhance');
const aiChatRoutes = require('./routes/ai-chat');
const accountBindingRoutes = require('./routes/account-binding');
const configRoutes = require('./routes/config');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountBindingRoutes); // 账号绑定接口
app.use('/api/config', configRoutes); // 配置管理接口
app.use('/api/billManager', optionalAuthMiddleware, billRoutes); // 需要登录才能操作
app.use('/api/ocrRecognize', authMiddleware, ocrRoutes); // 必须登录才能使用（修复：改用authMiddleware）
app.use('/api/baiduASR', authMiddleware, asrRoutes); // 必须登录才能使用（修复：改用authMiddleware）
app.use('/api/upload', authMiddleware, uploadRoutes); // 需要登录才能上传
app.use('/api/app', appRoutes); // 版本检查不需要认证
app.use('/api/ai-enhance', optionalAuthMiddleware, aiEnhanceRoutes); // AI 增强接口（可选认证）
app.use('/api/ai-chat', authMiddleware, aiChatRoutes); // AI 财务助手（需要登录）

// 健康检查 - 添加缓存
app.get('/health', cacheMiddleware(30000), (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功！`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});
