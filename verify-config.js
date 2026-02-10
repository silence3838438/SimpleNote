/**
 * Cloudbase AI 配置验证脚本
 * 验证配置文件是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🔍 Cloudbase AI 配置验证');
console.log('='.repeat(60));

// 验证项目
const checks = [];

// 1. 检查依赖
console.log('\n📦 检查 1: 验证依赖安装...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  
  if (deps['@cloudbase/js-sdk']) {
    console.log(`  ✅ @cloudbase/js-sdk: ${deps['@cloudbase/js-sdk']}`);
    checks.push({ name: '@cloudbase/js-sdk', status: 'pass' });
  } else {
    console.log('  ❌ @cloudbase/js-sdk 未安装');
    checks.push({ name: '@cloudbase/js-sdk', status: 'fail' });
  }
  
  if (deps['@cloudbase/adapter-uni-app']) {
    console.log(`  ✅ @cloudbase/adapter-uni-app: ${deps['@cloudbase/adapter-uni-app']}`);
    checks.push({ name: '@cloudbase/adapter-uni-app', status: 'pass' });
  } else {
    console.log('  ❌ @cloudbase/adapter-uni-app 未安装');
    checks.push({ name: '@cloudbase/adapter-uni-app', status: 'fail' });
  }
} catch (error) {
  console.log('  ❌ 无法读取 package.json');
  checks.push({ name: 'package.json', status: 'fail' });
}

// 2. 检查 cloudbase.js 配置
console.log('\n⚙️  检查 2: 验证 cloudbase.js 配置...');
try {
  const cloudbaseJs = fs.readFileSync('utils/cloudbase.js', 'utf8');
  
  // 检查 import 语句
  if (cloudbaseJs.includes('import cloudbaseSDK from "@cloudbase/js-sdk"')) {
    console.log('  ✅ SDK import 正确');
    checks.push({ name: 'SDK import', status: 'pass' });
  } else {
    console.log('  ❌ SDK import 缺失');
    checks.push({ name: 'SDK import', status: 'fail' });
  }
  
  if (cloudbaseJs.includes('import adapter from "@cloudbase/adapter-uni-app"')) {
    console.log('  ✅ Adapter import 正确');
    checks.push({ name: 'Adapter import', status: 'pass' });
  } else {
    console.log('  ❌ Adapter import 缺失');
    checks.push({ name: 'Adapter import', status: 'fail' });
  }
  
  // 检查 useAdapters
  if (cloudbaseJs.includes('cloudbaseSDK.useAdapters(adapter')) {
    console.log('  ✅ useAdapters 调用正确');
    checks.push({ name: 'useAdapters', status: 'pass' });
  } else {
    console.log('  ❌ useAdapters 调用缺失');
    checks.push({ name: 'useAdapters', status: 'fail' });
  }
  
  // 检查环境配置
  if (cloudbaseJs.includes('env: "cloud1-8gxevfq393690dfe"')) {
    console.log('  ✅ 环境 ID 配置正确');
    checks.push({ name: '环境 ID', status: 'pass' });
  } else {
    console.log('  ❌ 环境 ID 配置错误');
    checks.push({ name: '环境 ID', status: 'fail' });
  }
  
  if (cloudbaseJs.includes('region: "ap-shanghai"')) {
    console.log('  ✅ 区域配置正确');
    checks.push({ name: '区域', status: 'pass' });
  } else {
    console.log('  ❌ 区域配置错误');
    checks.push({ name: '区域', status: 'fail' });
  }
  
  // 检查 accessKey
  if (cloudbaseJs.includes('accessKey:') && cloudbaseJs.includes('eyJhbGciOiJSUzI1NiIs')) {
    console.log('  ✅ accessKey 已配置');
    checks.push({ name: 'accessKey', status: 'pass' });
  } else {
    console.log('  ❌ accessKey 未配置或配置错误');
    checks.push({ name: 'accessKey', status: 'fail' });
  }
  
  // 检查是否启用
  if (cloudbaseJs.includes('ENABLE_CLOUDBASE = true')) {
    console.log('  ✅ Cloudbase 已启用');
    checks.push({ name: 'ENABLE_CLOUDBASE', status: 'pass' });
  } else {
    console.log('  ⚠️  Cloudbase 未启用');
    checks.push({ name: 'ENABLE_CLOUDBASE', status: 'warn' });
  }
  
} catch (error) {
  console.log('  ❌ 无法读取 utils/cloudbase.js');
  checks.push({ name: 'cloudbase.js', status: 'fail' });
}

// 3. 检查 cloudbaseAI.js 配置
console.log('\n🤖 检查 3: 验证 cloudbaseAI.js 配置...');
try {
  const cloudbaseAIJs = fs.readFileSync('utils/cloudbaseAI.js', 'utf8');
  
  // 检查 Agent ID
  if (cloudbaseAIJs.includes("agent-xiaopiaoshi-2end0lcd9c419f")) {
    console.log('  ✅ Agent ID 配置正确');
    checks.push({ name: 'Agent ID', status: 'pass' });
  } else {
    console.log('  ❌ Agent ID 配置错误');
    checks.push({ name: 'Agent ID', status: 'fail' });
  }
  
  // 检查 AI 调用方法
  if (cloudbaseAIJs.includes('cloudbase.ai().bot.sendMessage')) {
    console.log('  ✅ AI 调用方法正确');
    checks.push({ name: 'AI 调用方法', status: 'pass' });
  } else {
    console.log('  ❌ AI 调用方法错误');
    checks.push({ name: 'AI 调用方法', status: 'fail' });
  }
  
  // 检查流式响应处理
  if (cloudbaseAIJs.includes('for await (const data of res.dataStream)')) {
    console.log('  ✅ 流式响应处理正确');
    checks.push({ name: '流式响应处理', status: 'pass' });
  } else {
    console.log('  ❌ 流式响应处理错误');
    checks.push({ name: '流式响应处理', status: 'fail' });
  }
  
  // 检查是否移除了不必要的登录逻辑
  if (!cloudbaseAIJs.includes('auth().anonymousAuthProvider().signIn()')) {
    console.log('  ✅ 已移除不必要的匿名登录逻辑');
    checks.push({ name: '移除匿名登录', status: 'pass' });
  } else {
    console.log('  ⚠️  仍包含匿名登录逻辑（可能导致问题）');
    checks.push({ name: '移除匿名登录', status: 'warn' });
  }
  
} catch (error) {
  console.log('  ❌ 无法读取 utils/cloudbaseAI.js');
  checks.push({ name: 'cloudbaseAI.js', status: 'fail' });
}

// 4. 检查测试图片
console.log('\n🖼️  检查 4: 验证测试图片...');
try {
  const testImagesDir = 'static/testImages';
  if (fs.existsSync(testImagesDir)) {
    const files = fs.readdirSync(testImagesDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`  ✅ 找到 ${imageFiles.length} 张测试图片`);
    imageFiles.forEach(f => console.log(`     - ${f}`));
    checks.push({ name: '测试图片', status: 'pass' });
  } else {
    console.log('  ❌ 测试图片目录不存在');
    checks.push({ name: '测试图片', status: 'fail' });
  }
} catch (error) {
  console.log('  ❌ 无法读取测试图片目录');
  checks.push({ name: '测试图片', status: 'fail' });
}

// 总结
console.log('\n' + '='.repeat(60));
console.log('📊 验证结果汇总');
console.log('='.repeat(60));

const passed = checks.filter(c => c.status === 'pass').length;
const warned = checks.filter(c => c.status === 'warn').length;
const failed = checks.filter(c => c.status === 'fail').length;
const total = checks.length;

console.log(`\n总计: ${total} 项检查`);
console.log(`  ✅ 通过: ${passed}`);
if (warned > 0) console.log(`  ⚠️  警告: ${warned}`);
if (failed > 0) console.log(`  ❌ 失败: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 配置验证通过！可以在 APP 中测试 AI 功能了。');
  console.log('\n📱 测试步骤:');
  console.log('  1. 在 HBuilderX 中重新运行 APP');
  console.log('  2. 进入拍照识别页面');
  console.log('  3. 选择 static/testImages 中的小票图片');
  console.log('  4. 查看控制台日志，确认 AI 增强是否生效');
} else {
  console.log('\n⚠️  配置存在问题，请修复后再测试。');
  console.log('\n失败的检查项:');
  checks.filter(c => c.status === 'fail').forEach(c => {
    console.log(`  ❌ ${c.name}`);
  });
}

console.log('\n' + '='.repeat(60));
