require('dotenv').config();
const db = require('./db');

async function migrateUsersTable() {
  try {
    console.log('开始迁移users表...');
    
    // 1. 检查并添加unionid字段
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN unionid VARCHAR(100) AFTER openid,
        ADD INDEX idx_unionid (unionid)
      `);
      console.log('✅ 添加unionid字段成功');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  unionid字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 2. 检查并添加apple_id字段
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN apple_id VARCHAR(100) AFTER session_key,
        ADD INDEX idx_apple_id (apple_id)
      `);
      console.log('✅ 添加apple_id字段成功');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  apple_id字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 3. 检查avatar字段，如果存在则重命名为avatar_url
    try {
      const columns = await db.query(`
        SHOW COLUMNS FROM users LIKE 'avatar'
      `);
      
      if (columns.length > 0) {
        await db.query(`
          ALTER TABLE users 
          CHANGE COLUMN avatar avatar_url VARCHAR(500)
        `);
        console.log('✅ 重命名avatar字段为avatar_url成功');
      } else {
        console.log('⚠️  avatar字段不存在，检查avatar_url字段');
        
        // 检查avatar_url是否存在
        const avatarUrlColumns = await db.query(`
          SHOW COLUMNS FROM users LIKE 'avatar_url'
        `);
        
        if (avatarUrlColumns.length === 0) {
          // 如果avatar_url也不存在，则添加
          await db.query(`
            ALTER TABLE users 
            ADD COLUMN avatar_url VARCHAR(500) AFTER nickname
          `);
          console.log('✅ 添加avatar_url字段成功');
        } else {
          console.log('⚠️  avatar_url字段已存在，跳过');
        }
      }
    } catch (error) {
      console.error('处理avatar字段时出错:', error);
      throw error;
    }
    
    console.log('✅ users表迁移完成！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrateUsersTable();
