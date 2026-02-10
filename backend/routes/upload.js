const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// 文件上传接口
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        success: false,
        message: '没有文件上传'
      });
    }

    // 构建完整的文件URL - 使用生产环境域名
    // 如果是通过 Nginx 代理访问，使用实际的域名
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    
    // 如果是本地开发环境，使用生产域名
    let fileUrl;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      fileUrl = `https://api.qiannaqule.top/uploads/${req.file.filename}`;
    } else {
      fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }
    
    res.json({
      success: true,
      url: fileUrl,
      fileID: req.file.filename,
      message: '上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.json({
      success: false,
      message: error.message || '上传失败'
    });
  }
});

module.exports = router;
