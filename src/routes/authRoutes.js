const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyRefreshToken, verifyEmailConfirmed } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validateMiddleware');

// Đăng ký và đăng nhập
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', verifyRefreshToken, authController.refreshToken);

// Xác thực email
router.post('/verify/send', verifyToken, authController.sendVerificationEmail);
router.get('/verify/:token', authController.verifyEmail);

// Quên mật khẩu và đặt lại mật khẩu
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router; 