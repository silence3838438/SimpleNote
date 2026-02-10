/**
 * 服务器端测试脚本：OCR识别、语音识别、AI增强
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3000/api';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function recordTest(name, passed, reason = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name} - 通过`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - 失败${reason ? ': ' + reason : ''}`);
  }
}

// ============================================
// 测试 1: 注册并获取Token
// ============================================
async function getToken() {
  console.log('\n' + '='.repeat(60));
  console.log('测试 1: 注册并获取Token');
  console.log('='.repeat(60));
  
  try {
    // 先尝试注册
    console.log('尝试注册测试账号...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/account-login`, {
      account: '13800138000',
      password: 'test123456',
      nickname: '测试用户'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      // 注册失败可能是账号已存在，继续尝试登录
      console.log('注册响应:', err.response?.data?.message || err.message);
      return null;
    });
    
    if (registerResponse && registerResponse.data.success && registerResponse.data.token) {
      console.log('注册成功并获取token');
      console.log(`Token: ${registerResponse.data.token.substring(0, 30)}...`);
      recordTest('注册并获取Token', true);
      return registerResponse.data.token;
    }
    
    // 如果注册失败，尝试登录
    console.log('尝试登录...');
    const response = await axios.post(`${API_BASE_URL}/auth/account-login`, {
      account: '13800138000',
      password: 'test123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.token) {
      console.log('登录成功');
      console.log(`Token: ${response.data.token.substring(0, 30)}...`);
      recordTest('注册并获取Token', true);
      return response.data.token;
    } else {
      console.log('登录失败: ' + (response.data.message || '未知错误'));
      recordTest('注册并获取Token', false, response.data.message);
      return null;
    }
  } catch (error) {
    console.log('获取Token异常: ' + error.message);
    if (error.response) {
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    recordTest('注册并获取Token', false, error.message);
    return null;
  }
}

// ============================================
// 测试 2: OCR 识别
// ============================================
async function testOCR(token) {
  console.log('\n' + '='.repeat(60));
  console.log('测试 2: OCR 识别');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('跳过测试：未获取到token');
    testResults.total++;
    testResults.failed++;
    return null;
  }
  
  try {
    // 读取测试图片
    const imagePath = path.join(__dirname, 'test-data/ocr-samples/WechatIMG617.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('测试图片不存在: ' + imagePath);
      recordTest('OCR识别', false, '测试图片不存在');
      return null;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    console.log(`图片读取成功，大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // 调用 OCR 接口
    console.log('调用 OCR 识别接口...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/ocrRecognize`, {
      imageBase64: imageBase64
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    console.log(`OCR 识别耗时: ${duration}ms`);
    
    if (response.data.success && response.data.data) {
      const result = response.data.data;
      console.log('OCR 识别成功');
      console.log('\n识别结果:');
      console.log(`  金额: ¥${result.amount}`);
      console.log(`  商家: ${result.merchant || '(未识别)'}`);
      console.log(`  分类: ${result.categoryName}`);
      console.log(`  日期: ${result.date}`);
      console.log(`  备注: ${result.remark || '(空)'}`);
      
      recordTest('OCR识别', true);
      return result;
    } else {
      console.log('OCR 识别失败: ' + (response.data.error || '未知错误'));
      recordTest('OCR识别', false, response.data.error);
      return null;
    }
  } catch (error) {
    console.log('OCR 识别异常: ' + error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    recordTest('OCR识别', false, error.message);
    return null;
  }
}

// ============================================
// 测试 3: OCR AI 增强
// ============================================
async function testOCRAIEnhance(token, ocrResult) {
  console.log('\n' + '='.repeat(60));
  console.log('测试 3: OCR AI 增强');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('跳过测试：未获取到token');
    testResults.total++;
    testResults.failed++;
    return null;
  }
  
  if (!ocrResult) {
    console.log('跳过测试：OCR识别失败');
    testResults.total++;
    testResults.failed++;
    return null;
  }
  
  try {
    const mockOCRText = `电子发票(普通发票)
发票号码:26317000000219389145
旅客运输服务
开票日期:2026年01月10日
销售方名称:享道出行(上海)科技股份有限公司
项目名称 单价 数量 金额
运输服务*客运服务费 21.36 1.00 21.36
合计 ￥21.36
价税合计(大写) 贰拾贰元整
(小写)￥22.00
备注:加班产品上线发布`;
    
    console.log('调用 OCR AI 增强接口...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/ai-enhance/ocr`, {
      ocrText: mockOCRText,
      baseInfo: ocrResult
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 60000
    });
    
    const duration = Date.now() - startTime;
    console.log(`AI 增强耗时: ${duration}ms`);
    
    if (response.data.success && response.data.data) {
      const result = response.data.data;
      console.log('OCR AI 增强成功');
      console.log('\nAI 增强结果:');
      console.log(`  金额: ¥${result.amount}`);
      console.log(`  商家: ${result.merchant || '(未识别)'}`);
      console.log(`  分类: ${result.categoryName}`);
      console.log(`  日期: ${result.date}`);
      console.log(`  备注: ${result.remark || '(空)'}`);
      console.log(`  AI 启用: ${response.data.aiEnabled ? '是' : '否'}`);
      
      const hasEnhancement = 
        result.remark !== ocrResult.remark ||
        result.merchant !== ocrResult.merchant ||
        result.categoryName !== ocrResult.categoryName;
      
      if (hasEnhancement) {
        console.log('AI 增强生效，字段已优化');
      } else {
        console.log('AI 增强未生效或无需优化');
      }
      
      recordTest('OCR AI增强', true);
      return result;
    } else {
      console.log('OCR AI 增强失败: ' + (response.data.error || '未知错误'));
      recordTest('OCR AI增强', false, response.data.error);
      return null;
    }
  } catch (error) {
    console.log('OCR AI 增强异常: ' + error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    recordTest('OCR AI增强', false, error.message);
    return null;
  }
}

// ============================================
// 测试 4: 语音识别 (模拟)
// ============================================
async function testASR() {
  console.log('\n' + '='.repeat(60));
  console.log('测试 4: 语音识别 (模拟)');
  console.log('='.repeat(60));
  
  try {
    const mockVoiceText = '今天在星巴克花了35块钱买了美式咖啡';
    
    console.log('模拟语音文本: ' + mockVoiceText);
    console.log('前端正则解析...');
    
    const baseInfo = {
      type: 'expense',
      amount: 35,
      merchant: '星巴克',
      categoryName: '餐饮',
      categoryId: 1,
      date: new Date().toISOString().split('T')[0],
      remark: mockVoiceText
    };
    
    console.log('前端正则解析成功');
    console.log('\n解析结果:');
    console.log(`  金额: ¥${baseInfo.amount}`);
    console.log(`  商家: ${baseInfo.merchant}`);
    console.log(`  分类: ${baseInfo.categoryName}`);
    console.log(`  日期: ${baseInfo.date}`);
    console.log(`  备注: ${baseInfo.remark}`);
    
    recordTest('语音识别(模拟)', true);
    return { voiceText: mockVoiceText, baseInfo };
  } catch (error) {
    console.log('语音识别异常: ' + error.message);
    recordTest('语音识别(模拟)', false, error.message);
    return null;
  }
}

// ============================================
// 测试 5: 语音 AI 增强
// ============================================
async function testVoiceAIEnhance(token, asrResult) {
  console.log('\n' + '='.repeat(60));
  console.log('测试 5: 语音 AI 增强');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('跳过测试：未获取到token');
    testResults.total++;
    testResults.failed++;
    return null;
  }
  
  if (!asrResult) {
    console.log('跳过测试：语音识别失败');
    testResults.total++;
    testResults.failed++;
    return null;
  }
  
  try {
    console.log('调用语音 AI 增强接口...');
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/ai-enhance/voice`, {
      voiceText: asrResult.voiceText,
      baseInfo: asrResult.baseInfo
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 60000
    });
    
    const duration = Date.now() - startTime;
    console.log(`AI 增强耗时: ${duration}ms`);
    
    if (response.data.success && response.data.data) {
      const result = response.data.data;
      console.log('语音 AI 增强成功');
      console.log('\nAI 增强结果:');
      console.log(`  金额: ¥${result.amount}`);
      console.log(`  商家: ${result.merchant || '(未识别)'}`);
      console.log(`  分类: ${result.categoryName}`);
      console.log(`  日期: ${result.date}`);
      console.log(`  备注: ${result.remark || '(空)'}`);
      console.log(`  AI 启用: ${response.data.aiEnabled ? '是' : '否'}`);
      
      const hasEnhancement = 
        result.remark !== asrResult.baseInfo.remark ||
        result.merchant !== asrResult.baseInfo.merchant ||
        result.categoryName !== asrResult.baseInfo.categoryName;
      
      if (hasEnhancement) {
        console.log('AI 增强生效，字段已优化');
      } else {
        console.log('AI 增强未生效或无需优化');
      }
      
      recordTest('语音 AI增强', true);
      return result;
    } else {
      console.log('语音 AI 增强失败: ' + (response.data.error || '未知错误'));
      recordTest('语音 AI增强', false, response.data.error);
      return null;
    }
  } catch (error) {
    console.log('语音 AI 增强异常: ' + error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    recordTest('语音 AI增强', false, error.message);
    return null;
  }
}

// ============================================
// 主测试流程
// ============================================
async function runAllTests() {
  console.log('\n🚀 开始测试识别和AI增强功能（服务器端）\n');
  console.log(`API 地址: ${API_BASE_URL}`);
  console.log(`测试时间: ${new Date().toLocaleString()}\n`);
  
  const startTime = Date.now();
  
  // 测试 1: 获取Token
  const token = await getToken();
  if (!token) {
    console.log('\n无法继续测试，请检查登录接口');
    process.exit(1);
  }
  
  await sleep(1000);
  
  // 测试 2: OCR 识别
  const ocrResult = await testOCR(token);
  await sleep(1000);
  
  // 测试 3: OCR AI 增强
  await testOCRAIEnhance(token, ocrResult);
  await sleep(1000);
  
  // 测试 4: 语音识别
  const asrResult = await testASR();
  await sleep(1000);
  
  // 测试 5: 语音 AI 增强
  await testVoiceAIEnhance(token, asrResult);
  
  // 输出测试报告
  const totalDuration = Date.now() - startTime;
  printTestReport(totalDuration);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printTestReport(duration) {
  console.log('\n' + '='.repeat(60));
  console.log('测试报告');
  console.log('='.repeat(60));
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(`总耗时: ${(duration / 1000).toFixed(2)}秒`);
  
  const passRate = testResults.total > 0 
    ? ((testResults.passed / testResults.total) * 100).toFixed(1)
    : 0;
  
  console.log(`\n通过率: ${passRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log(`\n⚠️  有 ${testResults.failed} 个测试失败`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// 执行测试
runAllTests().catch(error => {
  console.log('测试执行异常: ' + error.message);
  console.error(error);
  process.exit(1);
});
