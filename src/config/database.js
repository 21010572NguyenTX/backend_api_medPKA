const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medcure',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối MySQL thành công');
    connection.release();
    return true;
  } catch (error) {
    console.error('Lỗi kết nối MySQL:', error);
    return false;
  }
}

module.exports = { pool, testConnection };