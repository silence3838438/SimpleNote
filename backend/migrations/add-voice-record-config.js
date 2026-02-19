/**
 * 添加语音记账开关配置
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
  try {
    console.log('开始添加语音记账配置...');
    
    // 检查配置是否已存在
    const existing = await db.query(
      'SELECT id FROM app_config WHERE config_key = ?',
      ['show_voice_record']
    );
    
    if (existing && existing.length > 0) {
      console.log('⚠️  配置已存在，跳过');
      return;
    }
    
    // 插入配置
    await db.query(
      'INSERT INTO app_config (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)',
      ['show_voice_record', 'true', 'boolean', '是否显示语音记账入口']
    );
    
    console.log('✅ 语音记账配置添加成功');
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
