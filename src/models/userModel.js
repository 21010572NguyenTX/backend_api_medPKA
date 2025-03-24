const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  // Tạo người dùng mới
  async create(userData) {
    try {
      const { username, email, password, auth_type = 'email' } = userData;
      
      // Băm mật khẩu nếu đăng ký bằng email
      let hashedPassword = null;
      if (auth_type === 'email' && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      
      const query = `
        INSERT INTO users 
        (username, email, password, auth_type, is_email_verified) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      // OAuth users are automatically verified
      const isVerified = auth_type !== 'email';
      
      const [result] = await pool.query(query, [
        username, 
        email, 
        hashedPassword, 
        auth_type,
        isVerified
      ]);
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm người dùng theo email
  async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm người dùng theo ID
  async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, email, role, auth_type, is_email_verified, avatar_url, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm người dùng theo OAuth ID
  async findByOAuthId(provider, id) {
    try {
      const fieldName = `${provider}_id`;
      const [rows] = await pool.query(
        `SELECT * FROM users WHERE ${fieldName} = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  // Cập nhật thông tin người dùng
  async update(id, userData) {
    try {
      const { username, avatar_url } = userData;
      
      const query = `
        UPDATE users 
        SET username = ?, avatar_url = ? 
        WHERE id = ?
      `;
      
      await pool.query(query, [username, avatar_url, id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Cập nhật mật khẩu
  async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Cập nhật trạng thái xác thực email
  async verifyEmail(id) {
    try {
      await pool.query(`
        UPDATE users 
        SET is_email_verified = true, is_email_verified_at = NOW() 
        WHERE id = ?
      `, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Cập nhật thời gian gửi email xác thực
  async updateVerificationSent(id) {
    try {
      await pool.query(
        'UPDATE users SET last_verification_sent = NOW() WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Xóa tài khoản
  async delete(id) {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Xác thực mật khẩu
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserModel(); 