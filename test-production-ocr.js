/**
 * 测试生产环境OCR识别（使用真实账号登录）
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// 测试账号
const TEST_ACCOUNT = {
  phone: '17682824692',
  password: '123456'
};

// 测试图片目录
const TEST_DIR = './test-data/ocr-samples';

let authToken = null;

// 登录获取token
async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      account: TEST_ACCOUNT.phone,
      password: TEST_ACCOUNT.password
    });
    
    const options = {
      hostname: 'api.qiannaqule.top',
      port: 443,
      path: '/api/auth/account-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.token) {
            resolve(result.token);
          } else {
            reject(new Error(result.message || '登录失败'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 上传图片获取URL
async function uploadImage(imagePath, token) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    
    const options = {
      hostname: 'api.qiannaqule.top',
      port: 443,
      path: '/api/upload',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

// 调用OCR识别接口
async function recognizeImage(imageUrl, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      imageUrl: imageUrl,
      useAI: true  // 启用AI增强
    });
    
    const options = {
      hostname: 'api.qiannaqule.top',
      port: 443,
      path: '/api/ocrRecognize',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('   HTTP Status:', res.statusCode);
        console.log('   Response:', data.substring(0, 200));
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 测试单张图片
async function testImage(imagePath, token) {
  const fileName = path.basename(imagePath);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📷 测试图片: ${fileName}`);
  console.log('='.repeat(80));
  
  try {
    // 1. 上传图片
    console.log('📤 步骤1: 上传图片...');
    const uploadResult = await uploadImage(imagePath, token);
    
    if (!uploadResult.success) {
      throw new Error('图片上传失败: ' + uploadResult.message);
    }
    
    const imageUrl = uploadResult.url;
    console.log(`   ✅ 上传成功: ${imageUrl}`);
    
    // 2. OCR识别
    console.log('\n🔍 步骤2: OCR识别...');
    const result = await recognizeImage(imageUrl, token);
    
    if (result.success) {
      const data = result.data || {};
      console.log('✅ 识别成功!');
      console.log('\n📊 识别结果:');
      console.log(`   金额: ${data.amount}元`);
      console.log(`   商家: ${data.merchant || '未识别'}`);
      console.log(`   分类: ${data.categoryName || '未识别'} (ID: ${data.categoryId})`);
      console.log(`   备注: ${data.remark || '无'}`);
      console.log(`   日期: ${data.date || '未识别'}`);
      console.log(`   类型: ${data.type === 'income' ? '收入' : '支出'}`);
      
      if (result.aiEnhanced !== undefined) {
        console.log(`\n🤖 AI增强: ${result.aiEnhanced ? '已启用' : '未启用'}`);
      }
      
      // 显示OCR原始文本（前200字符）
      if (result.text) {
        const ocrPreview = result.text.substring(0, 200).replace(/\n/g, ' ');
        console.log(`\n📝 OCR文本预览: ${ocrPreview}...`);
      }
      
      return {
        fileName,
        success: true,
        amount: data.amount,
        merchant: data.merchant,
        categoryName: data.categoryName,
        remark: data.remark,
        aiEnhanced: result.aiEnhanced
      };
    } else {
      console.log('❌ 识别失败:', result.message);
      return {
        fileName,
        success: false,
        error: result.message
      };
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return {
      fileName,
      success: false,
      error: error.message
    };
  }
}

// 主函数
async function main() {
  console.log('🚀 开始测试生产环境OCR识别');
  console.log(`测试账号: ${TEST_ACCOUNT.phone}`);
  console.log(`测试目录: ${TEST_DIR}`);
  
  try {
    // 1. 登录
    console.log('\n🔑 正在登录...');
    authToken = await login();
    console.log('✅ 登录成功!');
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    
    // 2. 读取所有图片
    const files = fs.readdirSync(TEST_DIR)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .map(file => path.join(TEST_DIR, file));
    
    console.log(`\n📁 找到 ${files.length} 张测试图片`);
    
    // 3. 测试每张图片
    const results = [];
    for (const imagePath of files) {
      const result = await testImage(imagePath, authToken);
      results.push(result);
      
      // 等待2秒，避免API限流
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. 输出总结
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试总结');
    console.log('='.repeat(80));
    
    const successCount = results.filter(r => r.success).length;
    const aiEnabledCount = results.filter(r => r.success && r.aiEnhanced).length;
    
    console.log(`总计: ${results.length} 张图片`);
    console.log(`成功: ${successCount} 张`);
    console.log(`失败: ${results.length - successCount} 张`);
    console.log(`成功率: ${(successCount / results.length * 100).toFixed(1)}%`);
    console.log(`AI增强启用: ${aiEnabledCount} 张`);
    
    // 5. 输出详细结果表格
    console.log('\n详细结果:');
    console.log('-'.repeat(80));
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.fileName}`);
      if (result.success) {
        console.log(`   ✅ 金额: ${result.amount}元`);
        console.log(`   商家: ${result.merchant || '未识别'}`);
        console.log(`   分类: ${result.categoryName || '未识别'}`);
        const remarkPreview = (result.remark || '无').substring(0, 50);
        console.log(`   备注: ${remarkPreview}${result.remark && result.remark.length > 50 ? '...' : ''}`);
        console.log(`   AI增强: ${result.aiEnhanced ? '✓' : '✗'}`);
      } else {
        console.log(`   ❌ 错误: ${result.error}`);
      }
    });
    
    // 6. 分析金额准确性（需要人工对比）
    console.log('\n' + '='.repeat(80));
    console.log('💡 金额准确性分析（请人工对比实际小票）');
    console.log('='.repeat(80));
    
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`${index + 1}. ${result.fileName}: ${result.amount}元`);
      }
    });
    
    console.log('\n预期金额（根据之前的分析）:');
    console.log('1. WechatIMG186.jpg: 24.22元');
    console.log('2. WechatIMG617.jpg: 22.00元');
    console.log('3. WechatIMG618.jpg: 7.19元');
    console.log('4. WechatIMG619.jpg: 无法识别（图片模糊）');
    console.log('5. WechatIMG620.jpg: 5.06元');
    console.log('6. WechatIMG621.jpg: 15.89元');
    console.log('7. WechatIMG622.jpg: 5.6元');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
main();
