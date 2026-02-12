const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 测试音频文件路径
const audioFilePath = path.join(__dirname, '../test-data/ocr-samples/voicetest.m4a');

console.log('🎤 开始测试语音识别');
console.log('📁 音频文件:', audioFilePath);

// 检查文件是否存在
if (!fs.existsSync(audioFilePath)) {
  console.error('❌ 音频文件不存在:', audioFilePath);
  process.exit(1);
}

const fileStats = fs.statSync(audioFilePath);
console.log('📦 文件大小:', fileStats.size, 'bytes');

async function testVoiceRecognition() {
  try {
    // 第零步：登录获取token
    console.log('\n🔐 步骤0: 登录获取认证令牌');
    
    // 从命令行参数获取账号密码，或使用默认值
    const account = process.argv[2] || '18888888888';
    const password = process.argv[3] || '123456';
    
    console.log('📱 使用账号:', account);
    
    const loginResponse = await axios.post('https://api.qiannaqule.top/api/auth/account-login', {
      account: account,
      password: password
    });

    if (!loginResponse.data.success || !loginResponse.data.token) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      process.exit(1);
    }

    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token');

    // 第一步：上传音频文件
    console.log('\n📤 步骤1: 上传音频文件到服务器');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));

    const uploadResponse = await axios.post('https://api.qiannaqule.top/api/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📤 上传响应状态:', uploadResponse.status);
    console.log('📤 上传响应:', JSON.stringify(uploadResponse.data, null, 2));

    if (!uploadResponse.data.success || !uploadResponse.data.url) {
      console.error('❌ 上传失败:', uploadResponse.data.message);
      process.exit(1);
    }

    console.log('✅ 上传成功，URL:', uploadResponse.data.url);

    // 第二步：调用语音识别
    console.log('\n🎤 步骤2: 调用语音识别接口');

    const asrResponse = await axios.post('https://api.qiannaqule.top/api/baiduASR', {
      audioUrl: uploadResponse.data.url
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('🎤 识别响应状态:', asrResponse.status);
    console.log('🎤 识别响应:', JSON.stringify(asrResponse.data, null, 2));

    if (!asrResponse.data.success || !asrResponse.data.text) {
      console.error('❌ 识别失败:', asrResponse.data.error || '识别结果为空');
      process.exit(1);
    }

    console.log('\n✅ 识别成功！');
    console.log('📝 识别文本:', asrResponse.data.text);
    console.log('📝 文本长度:', asrResponse.data.text.length, '字符');

    // 第三步：测试本地解析逻辑
    console.log('\n📊 步骤3: 测试本地解析逻辑');
    testExtractBillInfo(asrResponse.data.text);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态:', error.response.status);
    }
    process.exit(1);
  }
}

// 模拟前端的 extractBillInfo 函数
function testExtractBillInfo(text) {
  console.log('🔍 开始提取账单信息');
  console.log('📝 原始文本:', text);

  // 提取金额
  let amount = 0;
  const amountPatterns = [
    /花了?\s*(\d+\.?\d*)\s*元/,
    /(\d+\.?\d*)\s*元/,
    /(\d+\.?\d*)\s*块钱/,
    /(\d+\.?\d*)\s*块/,
    /(\d+\.?\d*)\s*[¥￥]/,
    /[¥￥]\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*(?:人民币|rmb)/i,
    /花了?\s*(\d+\.?\d*)/
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      amount = parseFloat(match[1]);
      console.log('✅ 匹配到金额:', amount, '使用模式:', pattern);
      break;
    }
  }

  if (amount === 0) {
    const numberMatch = text.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      amount = parseFloat(numberMatch[1]);
      console.log('✅ 使用数字作为金额:', amount);
    } else {
      console.warn('⚠️ 未能提取到金额');
    }
  }

  // 提取商家
  let merchant = '';
  const merchantKeywords = ['滴滴', '滴滴出行', '美团', '饿了么', '星巴克', '麦当劳', 'KFC'];
  
  for (const keyword of merchantKeywords) {
    if (text.includes(keyword)) {
      merchant = keyword;
      console.log('✅ 匹配到商家:', merchant);
      break;
    }
  }

  if (!merchant) {
    console.warn('⚠️ 未能提取到商家');
  }

  // 判断类型
  const incomeKeywords = ['工资', '奖金', '红包', '退款', '收入', '赚', '挣', '收到'];
  let type = 'expense';
  
  for (const keyword of incomeKeywords) {
    if (text.includes(keyword)) {
      type = 'income';
      break;
    }
  }

  console.log('\n📊 解析结果:');
  console.log('  类型:', type);
  console.log('  金额:', amount);
  console.log('  商家:', merchant || '未识别');
  console.log('  原文:', text);

  if (amount === 0) {
    console.error('\n❌ 测试失败：金额为0');
    process.exit(1);
  }

  console.log('\n✅ 测试通过！');
  process.exit(0);
}

// 运行测试
testVoiceRecognition();
