const express = require('express');
const router = express.Router();

// Nhập các router
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const diseaseRoutes = require('./diseaseRoutes');
const medicineRoutes = require('./medicineRoutes');
const chatRoutes = require('./chatRoutes');

// Khai báo các route
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/diseases', diseaseRoutes);
router.use('/medicines', medicineRoutes);
router.use('/chat', chatRoutes);

// Route kiểm tra API hoạt động
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'MedCure API đang hoạt động',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route mặc định khi không tìm thấy
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Không tìm thấy API endpoint',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

module.exports = router; 