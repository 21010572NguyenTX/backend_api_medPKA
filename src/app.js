require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const routes = require('./routes');
const { sanitize } = require('./middleware/validateMiddleware');
const rateLimit = require('express-rate-limit');

// Khởi tạo ứng dụng
const app = express();

// Cấu hình middleware an toàn
app.use(helmet());

// Cấu hình CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Giới hạn yêu cầu API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 yêu cầu mỗi IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Giới hạn yêu cầu đăng nhập
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // Giới hạn 10 yêu cầu đăng nhập mỗi IP trong 1 giờ
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau',
    code: 'AUTH_RATE_LIMIT'
  }
});

// Áp dụng giới hạn cho các route xác thực
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Cấu hình ghi log
app.use(morgan('dev'));

// Cấu hình parse JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Middleware vệ sinh dữ liệu
app.use(sanitize);

// Đường dẫn API
app.use('/api', apiLimiter, routes);

// Xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Xử lý lỗi SyntaxError từ JSON.parse
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Định dạng JSON không hợp lệ',
      code: 'INVALID_JSON'
    });
  }

  // Các lỗi khác
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Lỗi máy chủ nội bộ',
    code: err.code || 'SERVER_ERROR'
  });
});

module.exports = app; 