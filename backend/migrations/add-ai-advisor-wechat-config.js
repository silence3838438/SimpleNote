/**
 * 添加微信小程序端功能总开关配置
 * 控制：AI财务顾问、语音记账、绑定手机号、注册页面等功能在小程序端的显示
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
  try {
    console.log('开始添加微信小程序端功能总开关配置...');
    
    // 检查配置是否已存在
    const existing = await db.query(
      'SELECT id FROM app_config WHERE config_key = ?',
      ['show_ai_advisor_wechat']
    );
    
    if (existing && existing.length > 0) {
      console.log('⚠️  配置已存在，跳过');
      return;
    }
    
    // 插入配置（默认false，小程序端不显示这些功能）
    await db.query(
      'INSERT INTO app_config (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)',
      ['show_ai_advisor_wechat', 'false', 'boolean', '微信小程序端功能总开关（控制AI财务顾问、语音记账、绑定手机号、注册页面等）']
    );
    
    console.log('✅ 微信小程序端功能总开关配置添加成功');
  } catch (error) {
    console.error('❌ 添加配置失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = migrate;
