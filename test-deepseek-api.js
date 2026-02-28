/**
 * DeepSeek API 测试脚本
 * 测试 OCR 和语音增强接口是否正常工作
 */

const axios = require('axios');

// 配置
const API_BASE_URL = 'https://api.qiannaqule.top/api';

// 测试数据
const testOCRData = {
  ocrText: `美团外卖
订单号：1234567890
商家：麦当劳
红烧鸡腿饭 x1
可乐 x1
实付金额：25.50元
2024-02-28 12:30`,
  baseInfo: {
    amount: 0,
    merchant: '',
    date: '2024-02-28',
    type: 'expense',
    remark: '',
    categoryName: '其他'
  }
};

const testVoiceData = {
  voiceText: '今天在星巴克买了一杯咖啡，花了三十六块钱',
  baseInfo: {
    amount: 0,
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    remark: '',
    categoryName: '其他'
  }
};

// 测试 OCR 增强接口
async function testOCREnhance() {
  console.log('\n🧪 测试 OCR 增强接口...');
  console.log('=' .repeat(60));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/ai-enhance/ocr`, testOCRData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ OCR 增强接口响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.aiEnabled) {
      console.log('\n✅ AI增强功能正常工作！');
      console.log('提取结果:');
      console.log(`  - 金额: ${response.data.data.amount}元`);
      console.log(`  - 商家: ${response.data.data.merchant}`);
      console.log(`  - 备注: ${response.data.data.remark}`);
      console.log(`  - 分类: ${response.data.data.categoryName}`);
    } else if (response.data.success && !response.data.aiEnabled) {
      console.log('\n⚠️ AI增强功能未启用（降级到后端原始数据）');
    } else {
      console.log('\n❌ 接口调用失败');
    }
    
  } catch (error) {
    console.error('❌ OCR 增强接口测试失败:');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

// 测试语音增强接口
async function testVoiceEnhance() {
  console.log('\n🧪 测试语音增强接口...');
  console.log('=' .repeat(60));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/ai-enhance/voice`, testVoiceData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ 语音增强接口响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.aiEnabled) {
      console.log('\n✅ AI增强功能正常工作！');
      console.log('提取结果:');
      console.log(`  - 金额: ${response.data.data.amount}元`);
      console.log(`  - 商家: ${response.data.data.merchant}`);
      console.log(`  - 备注: ${response.data.data.remark}`);
      console.log(`  - 分类: ${response.data.data.categoryName}`);
    } else if (response.data.success && !response.data.aiEnabled) {
      console.log('\n⚠️ AI增强功能未启用（降级到前端原始数据）');
    } else {
      console.log('\n❌ 接口调用失败');
    }
    
  } catch (error) {
    console.error('❌ 语音增强接口测试失败:');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 DeepSeek API 测试开始');
  console.log(`📍 API地址: ${API_BASE_URL}`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString('zh-CN')}`);
  
  await testOCREnhance();
  await testVoiceEnhance();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成！');
}

// 运行测试
main().catch(console.error);
