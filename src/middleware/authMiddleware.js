const jwtUtils = require('../utils/jwtUtils');
const userModel = require('../models/userModel');

// Middleware xác thực token
const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Không tìm thấy token xác thực',
        code: 'AUTH_TOKEN_MISSING'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Xác thực token
    const decoded = jwtUtils.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Token không hợp lệ hoặc đã hết hạn',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    // Tìm user từ token
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Người dùng không tồn tại',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }
    
    // Thêm thông tin user vào request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Lỗi xác thực',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Middleware kiểm tra quyền admin
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Chưa xác thực',
      code: 'AUTH_NOT_AUTHENTICATED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      status: 'error',
      message: 'Không có quyền truy cập',
      code: 'AUTH_ACCESS_DENIED'
    });
  }
  
  next();
};

// Middleware kiểm tra xác thực email
const verifyEmailConfirmed = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Chưa xác thực',
      code: 'AUTH_NOT_AUTHENTICATED'
    });
  }
  
  if (!req.user.email_verified) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Email chưa được xác thực',
      code: 'AUTH_EMAIL_NOT_VERIFIED', 
      verificationRequired: true
    });
  }
  
  next();
};

// Middleware thêm cảnh báo xác thực vào response
const addVerificationWarning = (req, res, next) => {
  if (req.user && !req.user.email_verified) {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (typeof data === 'object') {
        data.verification_warning = {
          message: 'Vui lòng xác thực email để bảo vệ tài khoản',
          can_verify: true
        };
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

// Middleware kiểm tra sử dụng refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Refresh token là bắt buộc',
        code: 'AUTH_REFRESH_TOKEN_MISSING'
      });
    }
    
    // Xác thực refresh token
    const decoded = jwtUtils.verifyToken(refresh_token, true);
    
    if (!decoded) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
        code: 'AUTH_REFRESH_TOKEN_INVALID'
      });
    }
    
    // Tìm user từ token
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Người dùng không tồn tại',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }
    
    // Thêm thông tin user vào request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Refresh token middleware error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Lỗi xác thực refresh token',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyEmailConfirmed,
  addVerificationWarning,
  verifyRefreshToken
}; 