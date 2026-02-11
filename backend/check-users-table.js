require('dotenv').config();
const db = require('./db');

async function checkUsersTable() {
  try {
    const columns = await db.query('SHOW COLUMNS FROM users');
    console.log('users表字段：');
    console.log(JSON.stringify(columns, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkUsersTable();
