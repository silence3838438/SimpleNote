const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'Qiannaqule2024!',
    database: 'simplenote'
  });
  
  try {
    const hash = await bcrypt.hash('test123456', 10);
    
    // 检查用户是否存在
    const [existing] = await connection.execute('SELECT * FROM users WHERE phone = ?', ['13800138000']);
    
    if (existing.length > 0) {
      // 更新密码
      await connection.execute('UPDATE users SET password = ? WHERE phone = ?', [hash, '13800138000']);
      console.log('测试用户密码已更新');
    } else {
      // 创建新用户
      await connection.execute(
        'INSERT INTO users (phone, password, nickname, created_at, last_login) VALUES (?, ?, ?, NOW(), NOW())',
        ['13800138000', hash, '测试用户']
      );
      console.log('测试用户创建成功');
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    await connection.end();
    process.exit(1);
  }
}

createTestUser();
