const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 简单的速率限制（内存存储，生产环境建议用 Redis）
const rateLimitMap = new Map();
const RATE_LIMIT = {
  maxRequests: 50,              // 登录用户：每小时 50 次
  windowMs: 60 * 60 * 1000
};

// 速率限制检查
function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  const record = rateLimitMap.get(key);
  
  // 重置计数器
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT.windowMs;
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  // 检查是否超限
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime 
    };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

// 百度语音识别
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.json({
        success: false,
        error: '请先登录后再使用此功能',
        needLogin: true
      });
    }
    
    // 速率限制检查
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return res.json({
        success: false,
        error: `请求过于频繁，请稍后再试（重置时间：${resetDate.toLocaleTimeString()})`
      });
    }
    
    let { filePath, audioBase64, audioUrl } = req.body;
    
    // 如果传的是音频 URL，转换为 base64
    if (audioUrl && !audioBase64) {
      try {
        let audioPath;
        
        // 判断是完整URL还是相对路径
        if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
          // 完整URL: 提取路径部分 (如 /uploads/xxx.aac)
          const urlObj = new URL(audioUrl);
          audioPath = path.join(__dirname, '..', urlObj.pathname);
        } else if (audioUrl.startsWith('/uploads/')) {
          // 绝对路径: /uploads/xxx.aac
          audioPath = path.join(__dirname, '..', audioUrl);
        } else {
          // 相对路径: uploads/xxx.aac
          audioPath = path.join(__dirname, '..', audioUrl);
        }
        
        console.log('原始URL:', audioUrl);
        console.log('解析后的本地路径:', audioPath);
        
        if (fs.existsSync(audioPath)) {
          const audioBuffer = fs.readFileSync(audioPath);
          audioBase64 = audioBuffer.toString('base64');
          console.log('✅ 音频读取成功，大小:', audioBuffer.length, 'bytes');
          
          // 从文件扩展名推断格式
          const ext = path.extname(audioPath).toLowerCase().replace('.', '');
          if (!req.body.format && ext) {
            req.body.format = ext;
            console.log('从文件扩展名推断格式:', ext);
          }
        } else {
          console.error('❌ 音频文件不存在:', audioPath);
          return res.json({
            success: false,
            error: '音频文件不存在'
          });
        }
      } catch (error) {
        console.error('❌ 音频转换失败:', error);
        return res.json({
          success: false,
          error: '音频转换失败: ' + error.message
        });
      }
    }
    
    if (!audioBase64 && !filePath) {
      return res.json({
        success: false,
        error: '缺少音频数据'
      });
    }

    // 如果有filePath，读取文件
    if (filePath && !audioBase64) {
      try {
        const audioBuffer = fs.readFileSync(filePath);
        audioBase64 = audioBuffer.toString('base64');
        console.log('从filePath读取音频，大小:', audioBuffer.length, 'bytes');
      } catch (error) {
        console.error('读取音频文件失败:', error);
        return res.json({
          success: false,
          error: '读取音频文件失败'
        });
      }
    }

    // 获取百度access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_ASR_API_KEY}&client_secret=${process.env.BAIDU_ASR_SECRET_KEY}`;
    
    const tokenRes = await axios.post(tokenUrl);
    const accessToken = tokenRes.data.access_token;

    // 百度ASR官方支持的格式：pcm, wav, amr
    // 参考：https://ai.baidu.com/ai-doc/SPEECH/Vk38lxily
    const formats = [
      { format: 'amr', rate: 8000 },    // APP端AMR格式（官方支持）
      { format: 'pcm', rate: 16000 },   // PCM格式（最佳，需ffmpeg转换）
      { format: 'pcm', rate: 8000 },
      { format: 'wav', rate: 16000 },   // WAV格式（官方支持）
      { format: 'wav', rate: 8000 }
      // 注意：百度ASR不支持mp3/aac/m4a等压缩格式
    ];
    
    // 如果指定了格式，优先尝试该格式
    if (req.body.format) {
      const specifiedFormat = formats.find(f => f.format === req.body.format);
      if (specifiedFormat) {
        formats.unshift(specifiedFormat);
      }
    }
    
    let lastError = null;
    let recognizedText = '';
    let triedFormats = [];
    
    // 音频数据大小
    const audioSize = Buffer.from(audioBase64, 'base64').length;
    console.log('📊 音频数据大小:', audioSize, 'bytes');
    
    // 由于服务器内存不足无法安装ffmpeg，直接使用原始mp3格式
    console.log('⚠️ 跳过PCM转换，直接使用原始格式（服务器内存限制）');
    
    for (const config of formats) {
      try {
        console.log(`🔄 尝试格式: ${config.format}, 采样率: ${config.rate}`);
        triedFormats.push(config.format);
        
        // 调用语音识别API
        const asrUrl = `https://vop.baidu.com/server_api`;
        
        const requestData = {
          format: config.format,
          rate: config.rate,
          channel: 1,
          cuid: 'simplenote',
          token: accessToken,
          speech: audioBase64,
          len: audioSize
        };
        
        console.log('📤 请求参数:', {
          format: config.format,
          rate: config.rate,
          channel: 1,
          len: audioSize,
          speechLength: audioBase64.length
        });
        
        const asrRes = await axios.post(asrUrl, requestData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        console.log(`📥 百度ASR返回 (${config.format}):`, JSON.stringify(asrRes.data));

        if (asrRes.data.err_no === 0 && asrRes.data.result && asrRes.data.result.length > 0) {
          recognizedText = asrRes.data.result[0];
          console.log('✅ 识别成功！');
          console.log('  格式:', config.format);
          console.log('  采样率:', config.rate);
          console.log('  识别结果:', recognizedText);
          console.log('  结果长度:', recognizedText.length, '字符');
          break;
        } else {
          console.log(`❌ 格式${config.format}识别失败`);
          console.log('  错误码:', asrRes.data.err_no);
          console.log('  错误信息:', asrRes.data.err_msg);
          
          // 记录常见错误码
          if (asrRes.data.err_no === 3300) {
            console.log('  💡 提示: 输入参数不正确');
          } else if (asrRes.data.err_no === 3301) {
            console.log('  💡 提示: 音频质量过差');
          } else if (asrRes.data.err_no === 3302) {
            console.log('  💡 提示: 鉴权失败');
          } else if (asrRes.data.err_no === 3303) {
            console.log('  💡 提示: 语音服务器后端问题');
          } else if (asrRes.data.err_no === 3307) {
            console.log('  💡 提示: 音频过长或过短');
          } else if (asrRes.data.err_no === 3308) {
            console.log('  💡 提示: 音频格式不支持');
          }
        }

        lastError = new Error(`格式${config.format}识别失败(${asrRes.data.err_no}: ${asrRes.data.err_msg})`);
      } catch (error) {
        console.log(`❌ 格式${config.format}请求失败:`, error.message);
        lastError = error;
      }
    }
    
    console.log('📋 尝试过的格式:', triedFormats.join(', '));
    
    if (!recognizedText) {
      throw lastError || new Error('所有格式都识别失败，请说清楚一些或使用文字输入');
    }

    res.json({
      success: true,
      text: recognizedText
    });

  } catch (error) {
    console.error('语音识别失败:', error);
    res.json({
      success: false,
      error: error.message || '识别失败，请重试'
    });
  }
});

module.exports = router;
