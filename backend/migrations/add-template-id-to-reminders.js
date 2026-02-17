/**
 * 数据库迁移脚本：为 reminders 表添加 template_id 字段
 * 运行方式：node backend/migrations/add-template-id-to-reminders.js
 */

// 优先使用 .env，如果不存在则使用 .env.local
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else {
  require('dotenv').config();
}

const db = require('../db');

async function migrate() {
  try {
    console.log('开始迁移：为 reminders 表添加 template_id 字段...');
    
    // 检查字段是否已存在
    const columns = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'reminders' 
      AND COLUMN_NAME = 'template_id'
    `, [process.env.DB_NAME || 'simplenote']);
    
    if (columns.length > 0) {
      console.log('✅ template_id 字段已存在，无需迁移');
      process.exit(0);
    }
    
    // 添加 template_id 字段
    await db.query(`
      ALTER TABLE reminders 
      ADD COLUMN template_id VARCHAR(100) DEFAULT NULL 
      AFTER time
    `);
    
    console.log('✅ 迁移成功：template_id 字段已添加到 reminders 表');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrate();
