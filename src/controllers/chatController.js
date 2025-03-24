const chatbotService = require('../services/chatbotService');
const searchHistoryController = require('./searchHistoryController');
const { pool } = require('../config/database');

const chatController = {
  // Xử lý câu hỏi của người dùng và trả về câu trả lời từ chatbot
  async handleChat(req, res) {
    try {
      const userId = req.user.id;
      const { question } = req.body;
      
      // Kiểm tra có câu hỏi không
      if (!question || question.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng nhập câu hỏi',
          code: 'QUESTION_REQUIRED'
        });
      }
      
      // Tìm nội dung liên quan từ cơ sở dữ liệu
      const { answer, sources } = await chatbotService.generateResponse(question);
      
      // Lưu lịch sử chat nếu thành công
      if (answer) {
        await chatbotService.saveChat(userId, question, answer, sources);
        
        // Lưu cả vào lịch sử tìm kiếm nếu có kết quả
        if (sources && sources.length > 0) {
          await searchHistoryController.addSearchHistory(userId, question, 'chat');
        }
      }
      
      return res.json({
        status: 'success',
        message: 'Câu trả lời từ chatbot',
        data: {
          question,
          answer,
          sources
        },
        is_verified: req.user.is_email_verified,
        warning: !req.user.is_email_verified ? 'Xác thực email để lưu lịch sử chat' : null
      });
    } catch (error) {
      console.error('Handle chat error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xử lý câu hỏi',
        code: 'CHAT_ERROR'
      });
    }
  },
  
  // Lấy lịch sử chat của người dùng
  async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;
      
      // Lấy lịch sử chat từ dịch vụ chatbot
      const result = await chatbotService.getUserChatHistory(userId, limit, offset);
      
      return res.json({
        status: 'success',
        message: 'Lấy lịch sử chat thành công',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy lịch sử chat',
        code: 'GET_CHAT_HISTORY_ERROR'
      });
    }
  },
  
  // Xóa một mục chat từ lịch sử
  async deleteChat(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Kiểm tra chat tồn tại và thuộc về người dùng
      const [chat] = await pool.query(
        'SELECT * FROM chat_history WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (chat.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy chat',
          code: 'CHAT_NOT_FOUND'
        });
      }
      
      // Xóa chat
      await pool.query(
        'DELETE FROM chat_history WHERE id = ?',
        [id]
      );
      
      return res.json({
        status: 'success',
        message: 'Xóa chat thành công'
      });
    } catch (error) {
      console.error('Delete chat error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa chat',
        code: 'DELETE_CHAT_ERROR'
      });
    }
  },
  
  // Xóa toàn bộ lịch sử chat của người dùng
  async clearChatHistory(req, res) {
    try {
      const userId = req.user.id;
      
      // Kết nối database
      const pool = require('../config/database');
      
      // Xóa tất cả chat của người dùng
      await pool.query(
        'DELETE FROM chat_history WHERE user_id = ?',
        [userId]
      );
      
      return res.json({
        status: 'success',
        message: 'Xóa lịch sử chat thành công'
      });
    } catch (error) {
      console.error('Clear chat history error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa lịch sử chat',
        code: 'CLEAR_CHAT_HISTORY_ERROR'
      });
    }
  }
};

module.exports = chatController; 