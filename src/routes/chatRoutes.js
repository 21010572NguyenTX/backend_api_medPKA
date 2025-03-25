const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, addVerificationWarning } = require('../middleware/authMiddleware');

// Routes chat
router.post('/', verifyToken, addVerificationWarning, chatController.processMessage);
router.get('/messages', verifyToken, chatController.getMessages);
router.delete('/messages', verifyToken, chatController.clearMessages);

module.exports = router; 