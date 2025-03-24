const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtUtils = {
  // Tạo access token
  generateAccessToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  },
  
  // Tạo refresh token
  generateRefreshToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  },
  
  // Xác thực token
  verifyToken(token, isRefreshToken = false) {
    try {
      const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }
};

module.exports = jwtUtils; 