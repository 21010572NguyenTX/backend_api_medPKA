const chatbotService = require('../services/chatbotService');
const searchHistoryController = require('./searchHistoryController');
const { pool } = require('../config/database');

class ChatController {
  /**
   * Xử lý tin nhắn từ người dùng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processMessage(req, res) {
    try {
      const { question } = req.body;
      const userId = req.user.id;
      
      // Kiểm tra có câu hỏi không
      if (!question || question.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng nhập câu hỏi',
          code: 'QUESTION_REQUIRED'
        });
      }
      
      // Xử lý tin nhắn và tạo phản hồi
      const result = await chatbotService.processMessage(userId, question);
      
      // Lưu cả vào lịch sử tìm kiếm nếu có kết quả
      if (result.sources && result.sources.length > 0) {
        await searchHistoryController.addSearchHistory(userId, question, 'chat');
      }
      
      return res.json({
        status: 'success',
        message: 'Câu trả lời từ chatbot',
        data: result,
        is_verified: req.user.is_email_verified,
        warning: !req.user.is_email_verified ? 'Xác thực email để lưu lịch sử chat' : null
      });
    } catch (error) {
      console.error('Process message error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xử lý câu hỏi: ' + error.message,
        code: 'CHAT_ERROR'
      });
    }
  }
  
  /**
   * Lấy tin nhắn của người dùng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object 
   */
  async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      // Lấy danh sách tin nhắn
      const result = await chatbotService.getMessages(userId, limit, offset);
      
      return res.json({
        status: 'success',
        message: 'Lấy danh sách tin nhắn thành công',
        data: result
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy danh sách tin nhắn: ' + error.message,
        code: 'GET_MESSAGES_ERROR'
      });
    }
  }
  
  /**
   * Xóa tất cả tin nhắn của người dùng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearMessages(req, res) {
    try {
      const userId = req.user.id;
      
      // Xóa tất cả tin nhắn của người dùng
      await chatbotService.clearMessages(userId);
      
      return res.json({
        status: 'success',
        message: 'Xóa tất cả tin nhắn thành công'
      });
    } catch (error) {
      console.error('Clear messages error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa tất cả tin nhắn: ' + error.message,
        code: 'CLEAR_MESSAGES_ERROR'
      });
    }
  }
}

module.exports = new ChatController(); 