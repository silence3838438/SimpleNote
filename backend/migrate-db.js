/**
 * 数据库迁移主脚本
 * 用于执行所有数据库结构变更
 */

require('dotenv').config();
const db = require('./db');

async function migrate() {
  try {
    console.log('开始数据库迁移...');
    
    // 初始化所有表（如果不存在则创建）
    await db.initTables();
    
    console.log('✅ 数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
