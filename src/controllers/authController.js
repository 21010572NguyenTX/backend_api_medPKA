const crypto = require('crypto');
const userModel = require('../models/userModel');
const jwtUtils = require('../utils/jwtUtils');
const emailService = require('../utils/emailService');
const { pool } = require('../config/database');

const authController = {
  // Đăng ký tài khoản
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Kiểm tra email đã tồn tại chưa
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email đã được sử dụng',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
      
      // Tạo user mới
      const userId = await userModel.create({
        username,
        email,
        password,
        auth_type: 'email'
      });
      
      // Tạo token xác thực email
      const token = crypto.randomBytes(32).toString('hex');
      
      // Lưu token vào database
      await pool.query(`
        INSERT INTO verification_tokens (user_id, token, type, expires_at)
        VALUES (?, ?, 'email_verify', DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `, [userId, token]);
      
      // Cập nhật thời gian gửi email xác thực
      await userModel.updateVerificationSent(userId);
      
      // Gửi email xác thực (async)
      const user = await userModel.findById(userId);
      emailService.sendVerificationEmail(user, token).catch(error => {
        console.error('Send verification email error:', error);
      });
      
      // Tạo JWT token
      const payload = { id: userId };
      const accessToken = jwtUtils.generateAccessToken(payload);
      const refreshToken = jwtUtils.generateRefreshToken(payload);
      
      // Trả về thông tin
      return res.status(201).json({
        status: 'success',
        message: 'Đăng ký thành công!',
        data: {
          user: {
            id: userId,
            username,
            email,
            email_verified: false
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        },
        verification_warning: {
          message: 'Vui lòng xác thực email để bảo vệ tài khoản',
          can_verify: true
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi đăng ký tài khoản',
        code: 'REGISTER_ERROR'
      });
    }
  },
  
  // Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Tìm user theo email
      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email hoặc mật khẩu không đúng',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      // Kiểm tra nếu user đăng ký bằng OAuth
      if (user.auth_type !== 'email') {
        return res.status(400).json({
          status: 'error',
          message: `Tài khoản này sử dụng đăng nhập qua ${user.auth_type}`,
          code: 'OAUTH_ACCOUNT'
        });
      }
      
      // Kiểm tra mật khẩu
      const isPasswordValid = await userModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Email hoặc mật khẩu không đúng',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      // Tạo JWT token
      const payload = { id: user.id };
      const accessToken = jwtUtils.generateAccessToken(payload);
      const refreshToken = jwtUtils.generateRefreshToken(payload);
      
      // Trả về thông tin
      const response = {
        status: 'success',
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            email_verified: !!user.email_verified,
            avatar_url: user.avatar_url,
            role: user.role
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      };
      
      // Thêm cảnh báo xác thực nếu cần
      if (!user.email_verified) {
        response.verification_warning = {
          message: 'Vui lòng xác thực email để bảo vệ tài khoản',
          can_verify: true
        };
      }
      
      return res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi đăng nhập',
        code: 'LOGIN_ERROR'
      });
    }
  },
  
  // Refresh token
  async refreshToken(req, res) {
    try {
      // userId đã được kiểm tra trong middleware
      const { id } = req.user;
      
      // Tạo token mới
      const payload = { id };
      const accessToken = jwtUtils.generateAccessToken(payload);
      const refreshToken = jwtUtils.generateRefreshToken(payload);
      
      return res.json({
        status: 'success',
        message: 'Refresh token thành công',
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi refresh token',
        code: 'REFRESH_TOKEN_ERROR'
      });
    }
  },
  
  // Gửi email xác thực
  async sendVerificationEmail(req, res) {
    try {
      const { id, email_verified, email, username } = req.user;
      
      // Kiểm tra đã xác thực email chưa
      if (email_verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email đã được xác thực',
          code: 'EMAIL_ALREADY_VERIFIED'
        });
      }
      
      // Kiểm tra thời gian gửi email gần nhất
      const [lastSent] = await pool.query(
        'SELECT last_verification_sent FROM users WHERE id = ?',
        [id]
      );
      
      const lastSentTime = lastSent[0].last_verification_sent;
      if (lastSentTime) {
        const timeDiff = Date.now() - new Date(lastSentTime).getTime();
        const minutes = Math.floor(timeDiff / 60000);
        
        if (minutes < 5) {
          return res.status(429).json({
            status: 'error',
            message: `Vui lòng đợi ${5 - minutes} phút trước khi gửi lại email`,
            code: 'EMAIL_RATE_LIMIT'
          });
        }
      }
      
      // Tạo token mới
      const token = crypto.randomBytes(32).toString('hex');
      
      // Xóa token cũ
      await pool.query(
        'DELETE FROM verification_tokens WHERE user_id = ? AND type = "email_verify"',
        [id]
      );
      
      // Lưu token mới
      await pool.query(`
        INSERT INTO verification_tokens (user_id, token, type, expires_at)
        VALUES (?, ?, 'email_verify', DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `, [id, token]);
      
      // Cập nhật thời gian gửi email
      await userModel.updateVerificationSent(id);
      
      // Gửi email
      const emailSent = await emailService.sendVerificationEmail({ email, username }, token);
      
      if (!emailSent) {
        return res.status(500).json({
          status: 'error',
          message: 'Lỗi gửi email xác thực',
          code: 'EMAIL_SEND_ERROR'
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Email xác thực đã được gửi'
      });
    } catch (error) {
      console.error('Send verification email error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi gửi email xác thực',
        code: 'EMAIL_SEND_ERROR'
      });
    }
  },
  
  // Xác thực email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // Kiểm tra token
      const [tokens] = await pool.query(`
        SELECT * FROM verification_tokens 
        WHERE token = ? AND type = 'email_verify' AND expires_at > NOW()
      `, [token]);
      
      if (tokens.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Token không hợp lệ hoặc đã hết hạn',
          code: 'INVALID_TOKEN'
        });
      }
      
      const userId = tokens[0].user_id;
      
      // Cập nhật trạng thái xác thực
      await userModel.verifyEmail(userId);
      
      // Xóa token đã sử dụng
      await pool.query(
        'DELETE FROM verification_tokens WHERE token = ?',
        [token]
      );
      
      return res.json({
        status: 'success',
        message: 'Email đã được xác thực thành công'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xác thực email',
        code: 'VERIFY_EMAIL_ERROR'
      });
    }
  },
  
  // Quên mật khẩu
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Tìm user theo email
      const user = await userModel.findByEmail(email);
      
      // Kiểm tra user tồn tại và đã xác thực email
      if (!user || !user.email_verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email không tồn tại hoặc chưa được xác thực',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }
      
      // Kiểm tra nếu user đăng ký bằng OAuth
      if (user.auth_type !== 'email') {
        return res.status(400).json({
          status: 'error',
          message: `Tài khoản này sử dụng đăng nhập qua ${user.auth_type}`,
          code: 'OAUTH_ACCOUNT'
        });
      }
      
      // Tạo token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Xóa token cũ
      await pool.query(
        'DELETE FROM verification_tokens WHERE user_id = ? AND type = "password_reset"',
        [user.id]
      );
      
      // Lưu token mới
      await pool.query(`
        INSERT INTO verification_tokens (user_id, token, type, expires_at)
        VALUES (?, ?, 'password_reset', DATE_ADD(NOW(), INTERVAL 1 HOUR))
      `, [user.id, token]);
      
      // Gửi email
      const emailSent = await emailService.sendPasswordResetEmail(user, token);
      
      if (!emailSent) {
        return res.status(500).json({
          status: 'error',
          message: 'Lỗi gửi email đặt lại mật khẩu',
          code: 'EMAIL_SEND_ERROR'
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Email đặt lại mật khẩu đã được gửi'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi quên mật khẩu',
        code: 'FORGOT_PASSWORD_ERROR'
      });
    }
  },
  
  // Đặt lại mật khẩu
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // Kiểm tra token
      const [tokens] = await pool.query(`
        SELECT * FROM verification_tokens 
        WHERE token = ? AND type = 'password_reset' AND expires_at > NOW()
      `, [token]);
      
      if (tokens.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Token không hợp lệ hoặc đã hết hạn',
          code: 'INVALID_TOKEN'
        });
      }
      
      const userId = tokens[0].user_id;
      
      // Cập nhật mật khẩu
      await userModel.updatePassword(userId, newPassword);
      
      // Xóa token đã sử dụng
      await pool.query(
        'DELETE FROM verification_tokens WHERE token = ?',
        [token]
      );
      
      return res.json({
        status: 'success',
        message: 'Mật khẩu đã được đặt lại thành công'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi đặt lại mật khẩu',
        code: 'RESET_PASSWORD_ERROR'
      });
    }
  }
};

module.exports = authController; 