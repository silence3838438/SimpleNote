#!/usr/bin/env node

/**
 * 简记账 - 全功能自动化测试脚本
 * 
 * 测试范围：
 * 1. 用户认证（注册、登录、登出）
 * 2. 账单管理（创建、查询、更新、删除）
 * 3. OCR识别 + AI增强
 * 4. 语音识别(ASR) + AI增强
 * 5. 管理后台接口
 * 6. 文件上传
 * 7. 版本检查
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  API_BASE: 'https://api.qiannaqule.top/api',
  ADMIN_BASE: 'https://api.qiannaqule.top/api/admin',
  TEST_ACCOUNT: 'test001',
  TEST_PASSWORD: 'test123456',
  ADMIN_ACCOUNT: 'admin',
  ADMIN_PASSWORD: 'admin123',
  TEST_IMAGES_DIR: path.join(__dirname, '../test-data/ocr-samples'),
  TEST_IMAGES: [
    'WechatIMG186.jpg',
    'WechatIMG617.jpg',
    'WechatIMG618.jpg',
    'WechatIMG619.jpg',
    'WechatIMG620.jpg',
    'WechatIMG621.jpg',
    'WechatIMG622.jpg'
  ]
};

// ==================== 测试结果统计 ====================
const STATS = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
  results: []
};

// ==================== 工具函数 ====================
function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${title}`);
  console.log('='.repeat(80));
}

function logTest(name) {
  STATS.total++;
  console.log(`\n🧪 测试 ${STATS.total}: ${name}`);
}

function logPass(message = '通过') {
  STATS.passed++;
  console.log(`   ✅ ${message}`);
}

function logFail(message, error = null) {
  STATS.failed++;
  console.log(`   ❌ ${message}`);
  if (error) {
    console.log(`   错误: ${error.message || error}`);
  }
}

function logSkip(message) {
  STATS.skipped++;
  console.log(`   ⏭️  ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 测试模块 ====================

/**
 * 1. 用户认证测试
 */
async function testAuth() {
  logSection('1. 用户认证测试');
  
  let token = null;
  
  // 1.1 账号登录
  logTest('账号登录');
  try {
    const response = await axios.post(`${CONFIG.API_BASE}/auth/account-login`, {
      account: CONFIG.TEST_ACCOUNT,
      password: CONFIG.TEST_PASSWORD
    });
    
    if (response.data.success && response.data.token) {
      token = response.data.token;
      logPass(`登录成功，获取token`);
      STATS.results.push({ test: '账号登录', status: 'passed', token: token.substring(0, 20) + '...' });
    } else {
      logFail('登录失败', response.data.message);
      STATS.results.push({ test: '账号登录', status: 'failed', error: response.data.message });
    }
  } catch (error) {
    logFail('登录请求失败', error);
    STATS.results.push({ test: '账号登录', status: 'failed', error: error.message });
  }
  
  // 1.2 获取用户信息
  if (token) {
    logTest('获取用户信息');
    try {
      const response = await axios.post(`${CONFIG.API_BASE}/billManager`, {
        action: 'getUserInfo'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.userInfo) {
        logPass(`用户: ${response.data.userInfo.nickName}`);
        STATS.results.push({ test: '获取用户信息', status: 'passed' });
      } else {
        logFail('获取用户信息失败');
        STATS.results.push({ test: '获取用户信息', status: 'failed' });
      }
    } catch (error) {
      logFail('请求失败', error);
      STATS.results.push({ test: '获取用户信息', status: 'failed', error: error.message });
    }
  }
  
  return token;
}

/**
 * 2. 账单管理测试
 */
async function testBills(token) {
  logSection('2. 账单管理测试');
  
  if (!token) {
    logSkip('跳过账单测试（未登录）');
    return null;
  }
  
  let billId = null;
  
  // 2.1 创建账单
  logTest('创建账单');
  try {
    const response = await axios.post(`${CONFIG.API_BASE}/billManager`, {
      action: 'add',
      data: {
        amount: 99.99,
        type: 'expense',
        categoryId: 1,
        categoryName: '餐饮',
        merchant: '测试商家',
        remark: '自动化测试账单',
        date: new Date().toISOString().split('T')[0]
      }
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success && response.data._id) {
      billId = response.data._id;
      logPass(`创建成功，ID: ${billId}`);
      STATS.results.push({ test: '创建账单', status: 'passed', billId });
    } else {
      logFail('创建失败');
      STATS.results.push({ test: '创建账单', status: 'failed' });
    }
  } catch (error) {
    logFail('请求失败', error);
    STATS.results.push({ test: '创建账单', status: 'failed', error: error.message });
  }
  
  // 2.2 查询账单列表
  logTest('查询账单列表');
  try {
    const response = await axios.post(`${CONFIG.API_BASE}/billManager`, {
      action: 'list',
      data: { limit: 10, skip: 0 }
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success && Array.isArray(response.data.data)) {
      logPass(`查询成功，共 ${response.data.data.length} 条`);
      STATS.results.push({ test: '查询账单列表', status: 'passed', count: response.data.data.length });
    } else {
      logFail('查询失败');
      STATS.results.push({ test: '查询账单列表', status: 'failed' });
    }
  } catch (error) {
    logFail('请求失败', error);
    STATS.results.push({ test: '查询账单列表', status: 'failed', error: error.message });
  }
  
  // 2.3 更新账单
  if (billId) {
    logTest('更新账单');
    try {
      const response = await axios.post(`${CONFIG.API_BASE}/billManager`, {
        action: 'update',
        data: {
          _id: billId,
          amount: 88.88,
          remark: '已更新的测试账单'
        }
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        logPass('更新成功');
        STATS.results.push({ test: '更新账单', status: 'passed' });
      } else {
        logFail('更新失败');
        STATS.results.push({ test: '更新账单', status: 'failed' });
      }
    } catch (error) {
      logFail('请求失败', error);
      STATS.results.push({ test: '更新账单', status: 'failed', error: error.message });
    }
  }
  
  // 2.4 删除账单
  if (billId) {
    logTest('删除账单');
    try {
      const response = await axios.post(`${CONFIG.API_BASE}/billManager`, {
        action: 'delete',
        data: { _id: billId }
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        logPass('删除成功');
        STATS.results.push({ test: '删除账单', status: 'passed' });
      } else {
        logFail('删除失败');
        STATS.results.push({ test: '删除账单', status: 'failed' });
      }
    } catch (error) {
      logFail('请求失败', error);
      STATS.results.push({ test: '删除账单', status: 'failed', error: error.message });
    }
  }
  
  return billId;
}

/**
 * 3. OCR识别 + AI增强测试
 */
async function testOCR(token) {
  logSection('3. OCR识别 + AI增强测试');
  
  if (!token) {
    logSkip('跳过OCR测试（未登录）');
    return;
  }
  
  // 测试所有图片
  for (let i = 0; i < CONFIG.TEST_IMAGES.length; i++) {
    const imageName = CONFIG.TEST_IMAGES[i];
    const testImage = path.join(CONFIG.TEST_IMAGES_DIR, imageName);
    
    if (!fs.existsSync(testImage)) {
      logSkip(`跳过图片 ${imageName}（文件不存在）`);
      continue;
    }
    
    // OCR识别
    logTest(`OCR识别 - ${imageName}`);
    try {
      const imageBuffer = fs.readFileSync(testImage);
      const imageBase64 = imageBuffer.toString('base64');
      
      const response = await axios.post(`${CONFIG.API_BASE}/ocrRecognize`, {
        action: 'recognize',
        imageBase64: imageBase64
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 30000
      });
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        logPass(`识别成功: 金额${result.amount}元, 商家"${result.merchant}", 分类"${result.categoryName}"`);
        STATS.results.push({ 
          test: `OCR识别 - ${imageName}`, 
          status: 'passed', 
          amount: result.amount,
          merchant: result.merchant,
          category: result.categoryName
        });
        
        // AI增强
        logTest(`OCR AI增强 - ${imageName}`);
        try {
          const aiResponse = await axios.post(`${CONFIG.API_BASE}/ai-enhance/ocr`, {
            ocrText: response.data.text || '',
            baseInfo: result
          }, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 60000
          });
          
          if (aiResponse.data.success) {
            const aiResult = aiResponse.data.data;
            logPass(`AI增强成功: 商家"${aiResult.merchant}", 分类"${aiResult.categoryName}", 备注"${aiResult.remark}"`);
            STATS.results.push({ 
              test: `OCR AI增强 - ${imageName}`, 
              status: 'passed', 
              aiEnabled: aiResponse.data.aiEnabled 
            });
          } else {
            logFail('AI增强失败');
            STATS.results.push({ test: `OCR AI增强 - ${imageName}`, status: 'failed' });
          }
        } catch (error) {
          logFail('AI增强请求失败', error);
          STATS.results.push({ test: `OCR AI增强 - ${imageName}`, status: 'failed', error: error.message });
        }
      } else {
        logFail('OCR识别失败');
        STATS.results.push({ test: `OCR识别 - ${imageName}`, status: 'failed' });
      }
    } catch (error) {
      logFail('OCR请求失败', error);
      STATS.results.push({ test: `OCR识别 - ${imageName}`, status: 'failed', error: error.message });
    }
    
    // 每张图片之间等待2秒
    await sleep(2000);
  }
}

/**
 * 4. 语音识别(ASR) + AI增强测试
 */
async function testASR(token) {
  logSection('4. 语音识别(ASR) + AI增强测试');
  
  if (!token) {
    logSkip('跳过ASR测试（未登录）');
    return;
  }
  
  const testScenarios = [
    { text: '今天午餐35元', expectedAmount: 35 },
    { text: '滴滴打车24元', expectedAmount: 24 }
  ];
  
  for (const scenario of testScenarios) {
    logTest(`语音场景: "${scenario.text}"`);
    
    // 模拟前端提取
    const baseInfo = {
      type: 'expense',
      amount: scenario.expectedAmount,
      merchant: '测试商家',
      categoryName: '餐饮',
      remark: scenario.text,
      date: new Date().toISOString().split('T')[0]
    };
    
    // AI增强
    try {
      const response = await axios.post(`${CONFIG.API_BASE}/ai-enhance/voice`, {
        voiceText: scenario.text,
        baseInfo: baseInfo
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 60000
      });
      
      if (response.data.success) {
        const result = response.data.data;
        logPass(`AI增强成功: 备注"${result.remark}", 分类"${result.categoryName}"`);
        STATS.results.push({ 
          test: `ASR AI增强: ${scenario.text}`, 
          status: 'passed',
          remark: result.remark
        });
      } else {
        logFail('AI增强失败');
        STATS.results.push({ test: `ASR AI增强: ${scenario.text}`, status: 'failed' });
      }
    } catch (error) {
      logFail('AI增强请求失败', error);
      STATS.results.push({ test: `ASR AI增强: ${scenario.text}`, status: 'failed', error: error.message });
    }
    
    await sleep(1000);
  }
}

/**
 * 5. 文件上传测试
 */
async function testUpload(token) {
  logSection('5. 文件上传测试');
  
  if (!token) {
    logSkip('跳过上传测试（未登录）');
    return;
  }
  
  logTest('文件上传');
  
  // 创建测试文件
  const testFile = '/tmp/test-upload.txt';
  fs.writeFileSync(testFile, 'Test upload file content');
  
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    
    const response = await axios.post(`${CONFIG.API_BASE}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    if (response.data.success && response.data.url) {
      logPass(`上传成功: ${response.data.url}`);
      STATS.results.push({ test: '文件上传', status: 'passed', url: response.data.url });
    } else {
      logFail('上传失败');
      STATS.results.push({ test: '文件上传', status: 'failed' });
    }
  } catch (error) {
    logFail('上传请求失败', error);
    STATS.results.push({ test: '文件上传', status: 'failed', error: error.message });
  } finally {
    // 清理测试文件
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

/**
 * 6. 版本检查测试
 */
async function testVersion() {
  logSection('6. 版本检查测试');
  
  logTest('APP版本检查');
  try {
    const response = await axios.post(`${CONFIG.API_BASE}/app/check-update`, {
      version: '1.0.0',
      platform: 'Android'
    });
    
    if (response.data.success && response.data.data) {
      logPass(`版本检查成功，有更新: ${response.data.data.hasUpdate}`);
      STATS.results.push({ 
        test: 'APP版本检查', 
        status: 'passed', 
        hasUpdate: response.data.data.hasUpdate
      });
    } else {
      logFail('版本检查失败');
      STATS.results.push({ test: 'APP版本检查', status: 'failed' });
    }
  } catch (error) {
    logFail('请求失败', error);
    STATS.results.push({ test: 'APP版本检查', status: 'failed', error: error.message });
  }
}

/**
 * 7. 管理后台测试
 */
async function testAdmin() {
  logSection('7. 管理后台测试');
  
  // 7.1 管理员登录
  logTest('管理员登录');
  let adminToken = null;
  
  try {
    const response = await axios.post(`${CONFIG.ADMIN_BASE}/login`, {
      username: CONFIG.ADMIN_ACCOUNT,
      password: CONFIG.ADMIN_PASSWORD
    });
    
    if (response.data.success && response.data.token) {
      adminToken = response.data.token;
      logPass('管理员登录成功');
      STATS.results.push({ test: '管理员登录', status: 'passed' });
    } else {
      logFail('管理员登录失败');
      STATS.results.push({ test: '管理员登录', status: 'failed' });
    }
  } catch (error) {
    logFail('登录请求失败', error);
    STATS.results.push({ test: '管理员登录', status: 'failed', error: error.message });
  }
  
  if (!adminToken) {
    logSkip('跳过管理后台测试（未登录）');
    return;
  }
  
  // 7.2 获取用户列表
  logTest('获取用户列表');
  try {
    const response = await axios.get(`${CONFIG.ADMIN_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      params: { page: 1, pageSize: 10 }
    });
    
    if (response.data.success && response.data.data) {
      logPass(`查询成功，共 ${response.data.data.total} 个用户`);
      STATS.results.push({ test: '获取用户列表', status: 'passed', total: response.data.data.total });
    } else {
      logFail('查询失败');
      STATS.results.push({ test: '获取用户列表', status: 'failed' });
    }
  } catch (error) {
    logFail('请求失败', error);
    STATS.results.push({ test: '获取用户列表', status: 'failed', error: error.message });
  }
  
  // 7.3 获取统计数据
  logTest('获取统计数据');
  try {
    const response = await axios.get(`${CONFIG.ADMIN_BASE}/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success && response.data.data) {
      logPass(`用户数: ${response.data.data.totalUsers}, 账单数: ${response.data.data.totalBills}`);
      STATS.results.push({ test: '获取统计数据', status: 'passed' });
    } else {
      logFail('查询失败');
      STATS.results.push({ test: '获取统计数据', status: 'failed' });
    }
  } catch (error) {
    logFail('请求失败', error);
    STATS.results.push({ test: '获取统计数据', status: 'failed', error: error.message });
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  const duration = ((Date.now() - STATS.startTime) / 1000).toFixed(2);
  const passRate = ((STATS.passed / STATS.total) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));
  console.log(`\n⏱️  总耗时: ${duration}秒`);
  console.log(`📈 测试总数: ${STATS.total}`);
  console.log(`✅ 通过: ${STATS.passed} (${passRate}%)`);
  console.log(`❌ 失败: ${STATS.failed}`);
  console.log(`⏭️  跳过: ${STATS.skipped}`);
  
  if (STATS.failed > 0) {
    console.log(`\n❌ 失败的测试:`);
    STATS.results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.test}: ${r.error || '未知错误'}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  if (STATS.failed === 0) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查失败详情');
  }
  console.log('='.repeat(80));
  
  // 保存报告到文件
  const report = {
    timestamp: new Date().toISOString(),
    duration: duration,
    stats: {
      total: STATS.total,
      passed: STATS.passed,
      failed: STATS.failed,
      skipped: STATS.skipped,
      passRate: passRate
    },
    results: STATS.results
  };
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 测试报告已保存到: test-report.json');
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(80));
  console.log('🚀 简记账 - 全功能自动化测试');
  console.log('='.repeat(80));
  console.log(`\n📅 测试时间: ${new Date().toLocaleString()}`);
  console.log(`🌐 API地址: ${CONFIG.API_BASE}`);
  console.log(`👤 测试账号: ${CONFIG.TEST_ACCOUNT}`);
  
  try {
    // 1. 用户认证
    const token = await testAuth();
    await sleep(1000);
    
    // 2. 账单管理
    await testBills(token);
    await sleep(1000);
    
    // 3. OCR识别
    await testOCR(token);
    await sleep(2000);
    
    // 4. 语音识别
    await testASR(token);
    await sleep(2000);
    
    // 5. 文件上传
    await testUpload(token);
    await sleep(1000);
    
    // 6. 版本检查
    await testVersion();
    await sleep(1000);
    
    // 7. 管理后台
    await testAdmin();
    
  } catch (error) {
    console.error('\n❌ 测试异常:', error.message);
  } finally {
    // 生成报告
    generateReport();
  }
}

// 运行测试
main().catch(console.error);
