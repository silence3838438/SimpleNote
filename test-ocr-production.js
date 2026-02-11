/**
 * 线上服务器OCR识别测试脚本
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置 - 使用线上服务器
const API_BASE_URL = 'https://api.qiannaqule.top/api';

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
    // 使用测试账号登录
    console.log('尝试登录测试账号...');
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
      recordTest('获取Token', true);
      return response.data.token;
    } else {
      console.log('登录失败: ' + (response.data.message || '未知错误'));
      recordTest('获取Token', false, response.data.message);
      return null;
    }
  } catch (error) {
    console.log('获取Token异常: ' + error.message);
    if (error.response) {
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    recordTest('获取Token', false, error.message);
    return null;
  }
}

// ============================================
// 测试 2: OCR 识别（批量测试所有图片）
// ============================================
async function testOCRBatch(token) {
  console.log('\n' + '='.repeat(60));
  console.log('测试 2: OCR 识别（批量测试）');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('跳过测试：未获取到token');
    testResults.total++;
    testResults.failed++;
    return [];
  }
  
  const samplesDir = path.join(__dirname, 'test-data/ocr-samples');
  
  if (!fs.existsSync(samplesDir)) {
    console.log('测试图片目录不存在: ' + samplesDir);
    recordTest('OCR识别批量测试', false, '测试图片目录不存在');
    return [];
  }
  
  // 读取所有jpg图片
  const imageFiles = fs.readdirSync(samplesDir)
    .filter(file => file.toLowerCase().endsWith('.jpg'))
    .sort();
  
  console.log(`找到 ${imageFiles.length} 张测试图片\n`);
  
  const results = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const imagePath = path.join(samplesDir, imageFile);
    
    console.log(`\n[${i + 1}/${imageFiles.length}] 测试图片: ${imageFile}`);
    console.log('-'.repeat(60));
    
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      
      console.log(`图片大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      
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
        console.log('✅ OCR 识别成功');
        console.log(`  金额: ¥${result.amount}`);
        console.log(`  商家: ${result.merchant || '(未识别)'}`);
        console.log(`  分类: ${result.categoryName}`);
        console.log(`  日期: ${result.date}`);
        console.log(`  备注: ${result.remark || '(空)'}`);
        console.log(`  原始文本长度: ${result.rawText ? result.rawText.length : 0} 字符`);
        
        // 对于问题图片，输出完整原始文本
        if (imageFile === 'WechatIMG621.jpg' || imageFile === 'WechatIMG186.jpg') {
          console.log('\n【原始OCR文本】:');
          console.log(result.rawText);
          console.log('【原始OCR文本结束】\n');
        }
        
        recordTest(`OCR识别-${imageFile}`, true);
        results.push({ 
          file: imageFile, 
          success: true, 
          result, 
          duration,
          rawText: result.rawText // 保存原始OCR文本用于AI增强
        });
      } else {
        console.log('❌ OCR 识别失败: ' + (response.data.error || '未知错误'));
        recordTest(`OCR识别-${imageFile}`, false, response.data.error);
        results.push({ file: imageFile, success: false, error: response.data.error });
      }
    } catch (error) {
      console.log('❌ OCR 识别异常: ' + error.message);
      if (error.response) {
        console.log('响应状态:', error.response.status);
        console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
      }
      recordTest(`OCR识别-${imageFile}`, false, error.message);
      results.push({ file: imageFile, success: false, error: error.message });
    }
    
    // 每张图片之间间隔1秒
    if (i < imageFiles.length - 1) {
      await sleep(1000);
    }
  }
  
  return results;
}

// ============================================
// 测试 3: AI 增强测试（针对问题图片）
// ============================================
async function testAIEnhance(token, ocrResults) {
  console.log('\n' + '='.repeat(60));
  console.log('测试 3: AI 增强测试');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('跳过测试：未获取到token');
    return [];
  }
  
  // 重点测试这两张有问题的图片
  const problemImages = ['WechatIMG186.jpg', 'WechatIMG621.jpg'];
  const aiResults = [];
  
  for (const ocrItem of ocrResults) {
    if (!problemImages.includes(ocrItem.file) || !ocrItem.success) {
      continue;
    }
    
    console.log(`\n测试图片: ${ocrItem.file}`);
    console.log('-'.repeat(60));
    console.log('OCR 原始结果:');
    console.log(`  金额: ¥${ocrItem.result.amount}`);
    console.log(`  商家: ${ocrItem.result.merchant || '(未识别)'}`);
    console.log(`  备注: ${ocrItem.result.remark || '(空)'}`);
    
    try {
      console.log('\n调用 AI 增强接口...');
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE_URL}/ai-enhance/ocr`, {
        ocrText: ocrItem.rawText,
        baseInfo: ocrItem.result
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
        const aiResult = response.data.data;
        console.log('\n✅ AI 增强成功');
        console.log(`  金额: ¥${aiResult.amount}`);
        console.log(`  商家: ${aiResult.merchant || '(未识别)'}`);
        console.log(`  备注: ${aiResult.remark || '(空)'}`);
        console.log(`  AI 启用: ${response.data.aiEnabled ? '是' : '否'}`);
        
        // 对比变化
        const changes = [];
        if (aiResult.amount !== ocrItem.result.amount) {
          changes.push(`金额: ${ocrItem.result.amount} → ${aiResult.amount}`);
        }
        if (aiResult.merchant !== ocrItem.result.merchant) {
          changes.push(`商家: ${ocrItem.result.merchant} → ${aiResult.merchant}`);
        }
        if (aiResult.remark !== ocrItem.result.remark) {
          changes.push(`备注: ${ocrItem.result.remark} → ${aiResult.remark}`);
        }
        
        if (changes.length > 0) {
          console.log('\n🔄 AI 增强变化:');
          changes.forEach(change => console.log(`  ${change}`));
        } else {
          console.log('\n⚠️  AI 未做任何修改');
        }
        
        recordTest(`AI增强-${ocrItem.file}`, true);
        aiResults.push({
          file: ocrItem.file,
          success: true,
          ocrResult: ocrItem.result,
          aiResult: aiResult,
          changes: changes,
          duration
        });
      } else {
        console.log('❌ AI 增强失败: ' + (response.data.error || '未知错误'));
        recordTest(`AI增强-${ocrItem.file}`, false, response.data.error);
        aiResults.push({
          file: ocrItem.file,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log('❌ AI 增强异常: ' + error.message);
      if (error.response) {
        console.log('响应状态:', error.response.status);
        console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
      }
      recordTest(`AI增强-${ocrItem.file}`, false, error.message);
      aiResults.push({
        file: ocrItem.file,
        success: false,
        error: error.message
      });
    }
    
    await sleep(2000); // AI增强间隔2秒
  }
  
  return aiResults;
}

// ============================================
// 主测试流程
// ============================================
async function runAllTests() {
  console.log('\n🚀 开始测试线上服务器OCR识别功能\n');
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
  
  // 测试 2: OCR 批量识别
  const ocrResults = await testOCRBatch(token);
  
  await sleep(2000);
  
  // 测试 3: AI 增强测试
  const aiResults = await testAIEnhance(token, ocrResults);
  
  // 输出测试报告
  const totalDuration = Date.now() - startTime;
  printTestReport(totalDuration, ocrResults, aiResults);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printTestReport(duration, ocrResults, aiResults = []) {
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
  
  // OCR 详细结果
  if (ocrResults.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('OCR 识别详细结果');
    console.log('='.repeat(60));
    
    ocrResults.forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.file}`);
      if (item.success) {
        console.log(`  ✅ 成功 (${item.duration}ms)`);
        console.log(`  金额: ¥${item.result.amount}`);
        console.log(`  商家: ${item.result.merchant || '(未识别)'}`);
        console.log(`  分类: ${item.result.categoryName}`);
        console.log(`  备注: ${item.result.remark || '(空)'}`);
      } else {
        console.log(`  ❌ 失败: ${item.error}`);
      }
    });
  }
  
  // AI 增强详细结果
  if (aiResults.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('AI 增强详细结果');
    console.log('='.repeat(60));
    
    aiResults.forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.file}`);
      if (item.success) {
        console.log(`  ✅ 成功 (${item.duration}ms)`);
        if (item.changes.length > 0) {
          console.log(`  🔄 AI 修正了 ${item.changes.length} 个字段:`);
          item.changes.forEach(change => console.log(`     ${change}`));
        } else {
          console.log(`  ⚠️  AI 未做修改`);
        }
      } else {
        console.log(`  ❌ 失败: ${item.error}`);
      }
    });
  }
  
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
