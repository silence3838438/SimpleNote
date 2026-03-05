/**
 * 数据库迁移：添加 push_client_id 字段
 * 用于存储 APP 端的推送客户端 ID
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
  try {
    console.log('========================================');
    console.log('🔄 开始数据库迁移：添加 push_client_id 字段');
    console.log('========================================\n');

    // 检查字段是否已存在
    const columns = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'push_client_id'
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log('✅ push_client_id 字段已存在，跳过迁移');
      return;
    }

    // 添加字段
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN push_client_id VARCHAR(255) DEFAULT NULL 
      COMMENT 'APP推送客户端ID'
    `);

    console.log('✅ 成功添加 push_client_id 字段');
    console.log('\n========================================');
    console.log('✅ 数据库迁移完成');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 执行迁移
migrate();
