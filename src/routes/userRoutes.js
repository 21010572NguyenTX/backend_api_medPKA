const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bookmarkController = require('../controllers/bookmarkController');
const searchHistoryController = require('../controllers/searchHistoryController');
const { verifyToken, verifyAdmin, verifyEmailConfirmed } = require('../middleware/authMiddleware');
const { validateId, validatePagination, validateUserUpdate, validateChangePassword } = require('../middleware/validateMiddleware');

// Thông tin và cập nhật người dùng
router.get('/profile', verifyToken, userController.getUserProfile);
router.put('/profile', verifyToken, validateUserUpdate, userController.updateUserProfile);
router.put('/change-password', verifyToken, verifyEmailConfirmed, validateChangePassword, userController.changePassword);
router.delete('/account', verifyToken, userController.deleteAccount);

// Lịch sử tìm kiếm
router.get('/search-history', verifyToken, validatePagination, searchHistoryController.getSearchHistory);
router.delete('/search-history/:id', verifyToken, validateId, searchHistoryController.deleteSearchHistory);
router.delete('/search-history', verifyToken, searchHistoryController.clearSearchHistory);

// Bookmark
router.get('/bookmarks', verifyToken, validatePagination, bookmarkController.getBookmarks);
router.post('/bookmarks', verifyToken, bookmarkController.addBookmark);
router.delete('/bookmarks/:id', verifyToken, validateId, bookmarkController.removeBookmark);

// Admin: Quản lý người dùng
router.get('/all', verifyToken, verifyAdmin, validatePagination, userController.getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, validateId, userController.getUserById);
router.put('/:id/role', verifyToken, verifyAdmin, validateId, userController.updateUserRole);
router.delete('/:id', verifyToken, verifyAdmin, validateId, userController.deleteUser);

module.exports = router; 