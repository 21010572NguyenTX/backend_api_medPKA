const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, verifyEmailConfirmed, addVerificationWarning } = require('../middleware/authMiddleware');
const { validatePagination, validateId } = require('../middleware/validateMiddleware');

// Routes chat
router.post('/', verifyToken, addVerificationWarning, chatController.handleChat);
router.get('/history', verifyToken, validatePagination, chatController.getChatHistory);
router.delete('/history/:id', verifyToken, validateId, chatController.deleteChat);
router.delete('/history', verifyToken, chatController.clearChatHistory);

module.exports = router; 