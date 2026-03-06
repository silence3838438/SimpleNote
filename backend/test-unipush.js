/**
 * UniPush 2.0 推送测试脚本
 * 用于测试 uniCloud 云函数推送功能
 * 
 * 使用方法：
 * 1. 确保已配置 UNICLOUD_PUSH_URL 环境变量
 * 2. 从数据库获取一个真实的 push_client_id
 * 3. 运行：node backend/test-unipush.js
 */

require('dotenv').config({ path: '.env.production' });
const axios = require('axios');
const db = require('./db');

async function testUniPush() {
  try {
    console.log('========================================');
    console.log('🧪 UniPush 2.0 推送测试');
    console.log('========================================\n');
    
    // 1. 检查环境变量
    const cloudFunctionUrl = process.env.UNICLOUD_PUSH_URL;
    if (!cloudFunctionUrl) {
      console.error('❌ 错误：未配置 UNICLOUD_PUSH_URL 环境变量');
      console.log('请在 backend/.env.production 中配置：');
      console.log('UNICLOUD_PUSH_URL=https://fc-xxx.next.bspapp.com/send-reminder\n');
      process.exit(1);
    }
    
    console.log('✅ 云函数 URL:', cloudFunctionUrl);
    console.log('');
    
    // 2. 使用真实的 ClientID
    console.log('📋 使用真实 ClientID...');
    
    const testClientId = '9d417fed64de74cfdb230eb31577f974';
    
    const testUser = {
      username: '测试用户',
      push_client_id: testClientId
    };
    
    console.log(`🎯 测试用户: ${testUser.username}`);
    console.log(`   ClientID: ${testUser.push_client_id}`);
    console.log('');
    
    // 3. 构造测试消息
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const message = {
      push_clientid: testUser.push_client_id,
      title: '记账提醒测试',
      content: `${dateStr} ${timeStr} - 这是一条测试推送消息`,
      request_id: `test_${Date.now()}`
    };
    
    console.log('📤 发送测试推送...');
    console.log('消息内容:', JSON.stringify(message, null, 2));
    console.log('');
    
    // 4. 调用云函数发送推送
    const startTime = Date.now();
    const response = await axios.post(cloudFunctionUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });
    const duration = Date.now() - startTime;
    
    console.log('========================================');
    console.log('📊 测试结果');
    console.log('========================================');
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📦 响应状态: ${response.status}`);
    console.log(`📄 响应数据:`, JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data && response.data.success) {
      console.log('✅ 推送发送成功！');
      console.log('');
      console.log('📱 请检查测试设备是否收到推送通知');
      console.log('');
      console.log('💡 提示：');
      console.log('   1. 确保测试设备已安装并登录 APP');
      console.log('   2. 确保设备已授权通知权限');
      console.log('   3. 如果 APP 在前台，会显示弹窗');
      console.log('   4. 如果 APP 在后台，会显示通知栏消息');
      console.log('');
    } else {
      console.log('❌ 推送发送失败');
      console.log('错误信息:', response.data?.message || '未知错误');
      console.log('');
    }
    
    console.log('========================================');
    console.log('✅ 测试完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ 测试失败');
    console.error('========================================');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示：无法连接到云函数 URL');
      console.error('   1. 检查 UNICLOUD_PUSH_URL 是否正确');
      console.error('   2. 检查云函数是否已开启 URL 化');
      console.error('   3. 检查网络连接');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 提示：请求超时');
      console.error('   1. 检查网络连接');
      console.error('   2. 检查云函数是否正常运行');
    }
    
    console.error('');
  } finally {
    process.exit(0);
  }
}

// 运行测试
console.log('');
testUniPush();
