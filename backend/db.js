const mysql = require('mysql2/promise');

// 创建数据库连接池 - 优化配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simplenote',
  waitForConnections: true,
  connectionLimit: 20, // 增加连接数（原10）
  queueLimit: 0,
  enableKeepAlive: true, // 保持连接活跃
  keepAliveInitialDelay: 0,
  maxIdle: 10, // 最大空闲连接数
  idleTimeout: 60000, // 空闲连接超时（60秒）
  connectTimeout: 10000 // 连接超时（10秒）
});

// 查询方法
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initTables() {
  try {
    // 用户表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openid VARCHAR(100) UNIQUE,
        unionid VARCHAR(100),
        phone VARCHAR(20),
        nickname VARCHAR(100),
        avatar_url VARCHAR(500),
        session_key VARCHAR(100),
        apple_id VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        last_logout DATETIME DEFAULT NULL,
        INDEX idx_openid (openid),
        INDEX idx_unionid (unionid),
        INDEX idx_apple_id (apple_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 账单表
    await query(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'expense',
        amount DECIMAL(10, 2) NOT NULL,
        merchant VARCHAR(200),
        date DATE NOT NULL,
        category_id INT,
        category_name VARCHAR(50),
        note TEXT,
        create_time BIGINT DEFAULT NULL,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 预算表
    await query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 提醒表
    await query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        enabled BOOLEAN DEFAULT FALSE,
        time VARCHAR(10) DEFAULT '21:00',
        template_id VARCHAR(100) DEFAULT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // APP版本管理表
    await query(`
      CREATE TABLE IF NOT EXISTS app_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform VARCHAR(20) NOT NULL COMMENT '平台: Android/iOS',
        version VARCHAR(20) NOT NULL COMMENT '版本号',
        update_content JSON NOT NULL COMMENT '更新内容数组',
        package_size VARCHAR(20) NOT NULL COMMENT '安装包大小',
        download_url VARCHAR(500) NOT NULL COMMENT '下载地址',
        is_force TINYINT(1) DEFAULT 0 COMMENT '是否强制更新',
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_platform_version (platform, version),
        INDEX idx_platform (platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='APP版本管理表';
    `);

    // AI对话使用记录表
    await query(`
      CREATE TABLE IF NOT EXISTS ai_chat_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
        question TEXT COMMENT '用户问题',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_user_date (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话使用记录表';
    `);

    // 安卓二维码表
    await query(`
      CREATE TABLE IF NOT EXISTS android_qrcode (
        id INT AUTO_INCREMENT PRIMARY KEY,
        qrcode_url VARCHAR(500) NOT NULL COMMENT '二维码URL',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安卓二维码表';
    `);

    // 应用配置表
    await query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
        config_value TEXT COMMENT '配置值',
        config_type VARCHAR(50) DEFAULT 'string' COMMENT '配置类型: string, boolean, number, json',
        description VARCHAR(255) COMMENT '配置描述',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用配置表';
    `);

    // 用户积分表
    await query(`
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

    // 积分历史表
    await query(`
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

    // 红包记录表
    await query(`
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

    // 用户反馈表
    await query(`
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

    // 插入默认配置
    await query(`
      INSERT INTO app_config (config_key, config_value, config_type, description) 
      VALUES 
        ('show_ai_advisor', 'true', 'boolean', '是否显示AI财务顾问功能（全局默认）'),
        ('show_ai_advisor_huawei', 'true', 'boolean', '华为应用市场是否显示AI财务顾问'),
        ('show_ai_advisor_xiaomi', 'true', 'boolean', '小米应用商店是否显示AI财务顾问'),
        ('show_ai_advisor_oppo', 'true', 'boolean', 'OPPO软件商店是否显示AI财务顾问'),
        ('show_ai_advisor_vivo', 'true', 'boolean', 'vivo应用商店是否显示AI财务顾问'),
        ('show_ai_advisor_honor', 'true', 'boolean', '荣耀应用市场是否显示AI财务顾问'),
        ('show_ai_advisor_ios', 'true', 'boolean', 'iOS App Store是否显示AI财务顾问'),
        ('show_ai_advisor_wechat', 'true', 'boolean', '微信小程序是否显示AI财务顾问')
      ON DUPLICATE KEY UPDATE config_key=config_key;
    `);

    console.log('✅ 数据库表初始化成功');
  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
  }
}

// 导出
module.exports = {
  query,
  testConnection,
  initTables,
  pool
};
