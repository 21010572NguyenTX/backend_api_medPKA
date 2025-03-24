const validator = require('validator');

// Kiểm tra và làm sạch đầu vào
const sanitize = (req, res, next) => {
  // Làm sạch body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key]);
      }
    });
  }
  
  // Làm sạch query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(req.query[key]);
      }
    });
  }
  
  next();
};

// Xác thực đăng ký
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = {};
  
  // Kiểm tra username
  if (!username || username.trim() === '') {
    errors.username = 'Tên người dùng là bắt buộc';
  } else if (username.length < 3 || username.length > 50) {
    errors.username = 'Tên người dùng phải có độ dài từ 3-50 ký tự';
  }
  
  // Kiểm tra email
  if (!email || email.trim() === '') {
    errors.email = 'Email là bắt buộc';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Email không hợp lệ';
  }
  
  // Kiểm tra password
  if (!password) {
    errors.password = 'Mật khẩu là bắt buộc';
  } else if (password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  
  // Trả về lỗi nếu có
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu đăng ký không hợp lệ',
      errors
    });
  }
  
  next();
};

// Xác thực đăng nhập
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  
  // Kiểm tra email
  if (!email || email.trim() === '') {
    errors.email = 'Email là bắt buộc';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Email không hợp lệ';
  }
  
  // Kiểm tra password
  if (!password) {
    errors.password = 'Mật khẩu là bắt buộc';
  }
  
  // Trả về lỗi nếu có
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu đăng nhập không hợp lệ',
      errors
    });
  }
  
  next();
};

// Xác thực cập nhật thông tin người dùng
const validateUserUpdate = (req, res, next) => {
  const { username } = req.body;
  const errors = {};
  
  // Kiểm tra username
  if (username !== undefined) {
    if (username.trim() === '') {
      errors.username = 'Tên người dùng không được để trống';
    } else if (username.length < 3 || username.length > 50) {
      errors.username = 'Tên người dùng phải có độ dài từ 3-50 ký tự';
    }
  }
  
  // Trả về lỗi nếu có
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu cập nhật không hợp lệ',
      errors
    });
  }
  
  next();
};

// Xác thực đổi mật khẩu
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = {};
  
  // Kiểm tra mật khẩu hiện tại
  if (!currentPassword) {
    errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
  }
  
  // Kiểm tra mật khẩu mới
  if (!newPassword) {
    errors.newPassword = 'Mật khẩu mới là bắt buộc';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
  }
  
  // Trả về lỗi nếu có
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu đổi mật khẩu không hợp lệ',
      errors
    });
  }
  
  next();
};

// Xác thực đặt lại mật khẩu
const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = {};
  
  // Kiểm tra token
  if (!token) {
    errors.token = 'Token là bắt buộc';
  }
  
  // Kiểm tra mật khẩu mới
  if (!newPassword) {
    errors.newPassword = 'Mật khẩu mới là bắt buộc';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
  }
  
  // Trả về lỗi nếu có
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu đặt lại mật khẩu không hợp lệ',
      errors
    });
  }
  
  next();
};

// Xác thực tham số phân trang
const validatePagination = (req, res, next) => {
  // Mặc định limit và offset
  let { limit = 10, offset = 0, page } = req.query;
  
  // Chuyển đổi sang số nguyên
  limit = parseInt(limit, 10);
  offset = parseInt(offset, 10);
  
  // Kiểm tra tính hợp lệ
  if (isNaN(limit) || limit < 1 || limit > 100) {
    limit = 10;
  }
  
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }
  
  // Nếu có page, tính offset dựa trên page
  if (page !== undefined) {
    page = parseInt(page, 10);
    if (!isNaN(page) && page > 0) {
      offset = (page - 1) * limit;
    }
  }
  
  // Cập nhật vào query
  req.query.limit = limit;
  req.query.offset = offset;
  
  next();
};

// Xác thực ID
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'ID không hợp lệ',
      code: 'INVALID_ID'
    });
  }
  
  req.params.id = id;
  next();
};

module.exports = {
  sanitize,
  validateRegister,
  validateLogin,
  validateUserUpdate,
  validateChangePassword,
  validateResetPassword,
  validatePagination,
  validateId
}; 