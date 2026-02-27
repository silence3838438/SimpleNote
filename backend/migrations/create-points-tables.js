/**
 * 创建积分相关表
 * 用户积分表和积分历史表
 */
require('dotenv').config({ path: '.env.production' });
const db = require('../db');

async function migrate() {
  try {
    console.log('开始创建积分相关表...');

    // 1. 创建用户积分表
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE COMMENT '用户ID',
        points INT DEFAULT 0 COMMENT '当前积分',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_user_id (user_id),
        INDEX idx_points (points)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户积分表';
    `);
    console.log('✅ user_points 表创建成功');

    // 2. 创建积分历史表
    await db.query(`
      CREATE TABLE IF NOT EXISTS points_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
        points INT NOT NULL COMMENT '积分变动（正数为增加，负数为减少）',
        reason VARCHAR(200) COMMENT '变动原因',
        metadata JSON COMMENT '元数据',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_user_id (user_id),
        INDEX idx_create_time (create_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分历史表';
    `);
    console.log('✅ points_history 表创建成功');

    // 3. 创建红包记录表（如果不存在）
    await db.query(`
      CREATE TABLE IF NOT EXISTS red_packet_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
        date DATE NOT NULL COMMENT '日期',
        morning_grabbed BOOLEAN DEFAULT FALSE COMMENT '上午是否已抢',
        afternoon_grabbed BOOLEAN DEFAULT FALSE COMMENT '下午是否已抢',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY unique_user_date (user_id, date),
        INDEX idx_user_id (user_id),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='红包记录表';
    `);
    console.log('✅ red_packet_records 表创建成功');

    // 4. 创建反馈表（如果不存在）
    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) COMMENT '用户ID（可为空，匿名反馈）',
        content TEXT NOT NULL COMMENT '反馈内容',
        images JSON COMMENT '图片列表',
        user_info JSON COMMENT '用户信息快照',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';
    `);
    console.log('✅ feedback 表创建成功');

    console.log('✅ 所有积分相关表创建完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrate();
