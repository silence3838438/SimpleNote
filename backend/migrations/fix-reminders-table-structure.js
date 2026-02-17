/**
 * 数据库迁移脚本：修复 reminders 表结构
 * 1. 将 reminder_time 字段改为可空并设置默认值
 * 2. 确保 time 字段存在且有默认值
 */

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
    console.log('开始迁移：修复 reminders 表结构...\n');
    
    // 1. 检查 reminder_time 字段
    console.log('1️⃣ 检查 reminder_time 字段...');
    const reminderTimeCol = await db.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'reminders' 
      AND COLUMN_NAME = 'reminder_time'
    `, [process.env.DB_NAME || 'simplenote']);
    
    if (reminderTimeCol.length > 0) {
      console.log('   reminder_time 字段存在');
      if (reminderTimeCol[0].IS_NULLABLE === 'NO') {
        console.log('   修改 reminder_time 为可空并设置默认值...');
        await db.query(`
          ALTER TABLE reminders 
          MODIFY COLUMN reminder_time VARCHAR(10) DEFAULT '21:00'
        `);
        console.log('   ✅ reminder_time 字段已修改\n');
      } else {
        console.log('   ✅ reminder_time 字段已经是可空的\n');
      }
    }
    
    // 2. 检查 time 字段
    console.log('2️⃣ 检查 time 字段...');
    const timeCol = await db.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'reminders' 
      AND COLUMN_NAME = 'time'
    `, [process.env.DB_NAME || 'simplenote']);
    
    if (timeCol.length === 0) {
      console.log('   time 字段不存在，创建它...');
      await db.query(`
        ALTER TABLE reminders 
        ADD COLUMN time VARCHAR(10) DEFAULT '21:00' AFTER enabled
      `);
      console.log('   ✅ time 字段已创建\n');
    } else {
      console.log('   ✅ time 字段已存在\n');
    }
    
    // 3. 同步 reminder_time 的值到 time 字段（如果 time 为空）
    console.log('3️⃣ 同步数据...');
    if (reminderTimeCol.length > 0 && timeCol.length > 0) {
      await db.query(`
        UPDATE reminders 
        SET time = reminder_time 
        WHERE time IS NULL OR time = ''
      `);
      console.log('   ✅ 数据同步完成\n');
    } else if (reminderTimeCol.length > 0) {
      // time 字段刚创建，需要同步所有数据
      await db.query(`
        UPDATE reminders 
        SET time = reminder_time
      `);
      console.log('   ✅ 数据同步完成\n');
    }
    
    console.log('========================================');
    console.log('✅ 迁移成功：reminders 表结构已修复');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrate();
