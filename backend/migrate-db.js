#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 用于执行数据库结构变更
 */

require('dotenv').config();
const db = require('./db');

// 迁移任务列表
const migrations = [
  {
    name: '修改bills表create_time字段类型为BIGINT',
    sql: 'ALTER TABLE bills MODIFY COLUMN create_time BIGINT DEFAULT NULL',
    // 检查是否需要执行的SQL
    checkSql: "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'simplenote' AND TABLE_NAME = 'bills' AND COLUMN_NAME = 'create_time'",
    shouldRun: (result) => {
      // 如果字段类型不是bigint，则需要执行迁移
      return result.length > 0 && result[0].DATA_TYPE !== 'bigint';
    }
  }
];

async function runMigrations() {
  console.log('🔄 开始数据库迁移...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const migration of migrations) {
    try {
      console.log(`📋 检查: ${migration.name}`);
      
      // 检查是否需要执行
      if (migration.checkSql && migration.shouldRun) {
        const checkResult = await db.query(migration.checkSql);
        if (!migration.shouldRun(checkResult)) {
          console.log(`⏭️  跳过: 已经执行过\n`);
          skipCount++;
          continue;
        }
      }
      
      // 执行迁移
      await db.query(migration.sql);
      console.log(`✅ 成功: ${migration.name}\n`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ 失败: ${migration.name}`);
      console.error(`   错误: ${error.message}\n`);
      errorCount++;
    }
  }
  
  console.log('=========================================');
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`⏭️  跳过: ${skipCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  console.log('=========================================\n');
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// 执行迁移
runMigrations().catch(error => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});
