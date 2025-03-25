const axios = require('axios');
const { pool } = require('../config/database');
const embeddingService = require('./embeddingService');
const translationService = require('./translationService');
const { v4: uuidv4 } = require('uuid');

class ChatbotService {
  /**
   * Tìm nội dung liên quan từ cơ sở dữ liệu dựa trên câu hỏi
   * @param {string} question - Câu hỏi của người dùng
   * @returns {Promise<Array>} - Danh sách nội dung liên quan
   */
  async findRelevantContent(question) {
    try {
      // Xác định ngôn ngữ của câu hỏi
      const language = this.detectLanguage(question);
      
      // Sử dụng embeddingService để tìm nội dung liên quan
      return await embeddingService.findRelevantContent(question, language);
    } catch (error) {
      console.error('Lỗi tìm nội dung liên quan:', error);
      return [];
    }
  }
  
  /**
   * Tạo ngữ cảnh từ nội dung tìm được
   * @param {Array} contents - Danh sách nội dung liên quan
   * @param {string} language - Ngôn ngữ của câu hỏi ('en' hoặc 'vi')
   * @returns {string} - Ngữ cảnh đã được định dạng
   */
  createContextFromContent(contents, language = 'vi') {
    return embeddingService.createContextFromContent(contents, language);
  }
  
  /**
   * Phát hiện ngôn ngữ của văn bản (đơn giản)
   * @param {string} text - Văn bản cần phát hiện ngôn ngữ
   * @returns {string} - Mã ngôn ngữ ('en' hoặc 'vi')
   */
  detectLanguage(text) {
    if (!text) return 'vi';
    
    // Danh sách từ tiếng Việt phổ biến để phát hiện
    const vietnameseWords = [
      'của', 'và', 'là', 'trong', 'có', 'được', 'để', 'những', 'không', 'với',
      'một', 'bạn', 'tôi', 'này', 'các', 'người', 'đã', 'cho', 'về', 'cần'
    ];
    
    // Đếm số từ tiếng Việt
    const lowercaseText = text.toLowerCase();
    let vietnameseCount = 0;
    
    vietnameseWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowercaseText.match(regex);
      if (matches) {
        vietnameseCount += matches.length;
      }
    });
    
    // Nếu có nhiều từ tiếng Việt, xác định là tiếng Việt
    return vietnameseCount >= 1 ? 'vi' : 'en';
  }
  
  /**
   * Tạo phản hồi từ AI dựa trên câu hỏi và ngữ cảnh
   * @param {string} question - Câu hỏi của người dùng
   * @returns {Promise<Object>} - Câu trả lời và nguồn
   */
  async generateResponse(question) {
    try {
      if (!question) {
        return { answer: 'Vui lòng nhập câu hỏi', sources: [] };
      }
      
      // Phát hiện ngôn ngữ
      const language = this.detectLanguage(question);
      
      // Tìm nội dung liên quan
      const relevantContents = await this.findRelevantContent(question);
      
      // Kiểm tra nếu không có nội dung liên quan
      if (!relevantContents || relevantContents.length === 0) {
        const noInfoMessage = language === 'vi' 
          ? 'Xin lỗi, tôi không có đủ thông tin để trả lời câu hỏi này. Vui lòng thử với từ khóa khác.'
          : 'Sorry, I don\'t have enough information to answer this question. Please try with different keywords.';
        return { answer: noInfoMessage, sources: [] };
      }
      
      // Tạo ngữ cảnh từ nội dung tìm được
      const context = this.createContextFromContent(relevantContents, language);
      
      // Tạo prompt cho AI
      const prompt = embeddingService.createPrompt(question, context, language);
      
      // Kiểm tra cấu hình DeepSeek API
      if (!embeddingService.isDeepSeekConfigured()) {
        console.error('Cấu hình DeepSeek API chưa hoàn tất');
        const configError = language === 'vi'
          ? 'Lỗi cấu hình chatbot. Vui lòng liên hệ quản trị viên.'
          : 'Chatbot configuration error. Please contact the administrator.';
        return { answer: configError, sources: [] };
      }
      
      // Gọi DeepSeek API
      const response = await axios.post(
        process.env.DEEPSEEK_API_URL,
        {
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          timeout: 30000 // 30 giây timeout
        }
      );
      
      let answer = '';
      
      // Xử lý phản hồi từ DeepSeek
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        answer = response.data.choices[0].message.content.trim();
      } else {
        answer = language === 'vi'
          ? 'Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại.'
          : 'Sorry, I couldn\'t process this question. Please try again.';
      }
      
      // Tạo danh sách nguồn
      const sources = relevantContents.map(item => {
        return {
          id: item.id,
          type: item.type,
          name: language === 'vi' ? item.name_vi : item.name
        };
      });
      
      return { answer, sources };
    } catch (error) {
      console.error('Lỗi tạo phản hồi:', error);
      const errorMessage = this.detectLanguage(question) === 'vi'
        ? 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
        : 'Sorry, an error occurred while processing your question. Please try again later.';
      return { answer: errorMessage, sources: [] };
    }
  }
  
  /**
   * Tạo cuộc trò chuyện mới
   * @param {number} userId - ID người dùng
   * @param {string} title - Tiêu đề cuộc trò chuyện (tùy chọn)
   * @returns {Promise<string>} - ID của cuộc trò chuyện mới
   */
  async createConversation(userId, title = null) {
    try {
      const conversationId = uuidv4();
      
      await pool.query(
        `INSERT INTO conversations (id, user_id, title, model_used)
         VALUES (?, ?, ?, ?)`,
        [conversationId, userId, title, process.env.DEEPSEEK_MODEL || 'deepseek-chat']
      );
      
      return conversationId;
    } catch (error) {
      console.error('Lỗi tạo cuộc trò chuyện:', error);
      throw error;
    }
  }
  
  /**
   * Lưu tin nhắn vào cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @param {string} role - Vai trò (user, assistant, system)
   * @param {string} content - Nội dung tin nhắn
   * @param {Array} sources - Nguồn tham khảo (tùy chọn)
   * @param {Object} metadata - Metadata bổ sung (tùy chọn)
   * @returns {Promise<string>} - ID của tin nhắn mới
   */
  async saveMessage(conversationId, role, content, sources = null, metadata = null) {
    try {
      const messageId = uuidv4();
      const sourcesJSON = sources ? JSON.stringify(sources) : null;
      const metadataJSON = metadata ? JSON.stringify(metadata) : null;
      
      await pool.query(
        `INSERT INTO messages (id, conversation_id, role, content, sources, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [messageId, conversationId, role, content, sourcesJSON, metadataJSON]
      );
      
      // Cập nhật thời gian cuộc trò chuyện
      await pool.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = ?`,
        [conversationId]
      );
      
      return messageId;
    } catch (error) {
      console.error('Lỗi lưu tin nhắn:', error);
      throw error;
    }
  }
  
  /**
   * Xử lý tin nhắn từ người dùng và tạo phản hồi
   * @param {number} userId - ID người dùng
   * @param {string} question - Câu hỏi
   * @param {string} conversationId - ID cuộc trò chuyện (tùy chọn, nếu không có sẽ tạo mới)
   * @returns {Promise<Object>} - Thông tin tin nhắn và phản hồi
   */
  async processMessage(userId, question, conversationId = null) {
    try {
      // Nếu không có conversationId, tạo cuộc trò chuyện mới
      if (!conversationId) {
        conversationId = await this.createConversation(userId, question.substring(0, 100));
      } else {
        // Kiểm tra xem cuộc trò chuyện có tồn tại và thuộc về người dùng không
        const [conversations] = await pool.query(
          `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
          [conversationId, userId]
        );
        
        if (conversations.length === 0) {
          throw new Error('Cuộc trò chuyện không tồn tại hoặc không thuộc về người dùng');
        }
      }
      
      // Lưu tin nhắn của người dùng
      const userMessageId = await this.saveMessage(conversationId, 'user', question);
      
      // Tạo phản hồi từ AI
      const { answer, sources } = await this.generateResponse(question);
      
      // Lưu tin nhắn của assistant
      const assistantMessageId = await this.saveMessage(
        conversationId, 
        'assistant', 
        answer, 
        sources,
        { model: process.env.DEEPSEEK_MODEL || 'deepseek-chat' }
      );
      
      return {
        conversation_id: conversationId,
        user_message_id: userMessageId,
        assistant_message_id: assistantMessageId,
        question,
        answer,
        sources
      };
    } catch (error) {
      console.error('Lỗi xử lý tin nhắn:', error);
      throw error;
    }
  }
  
  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   * @param {number} userId - ID người dùng
   * @param {number} limit - Giới hạn số bản ghi
   * @param {number} offset - Vị trí bắt đầu
   * @returns {Promise<Object>} - Danh sách cuộc trò chuyện và thông tin phân trang
   */
  async getConversations(userId, limit = 10, offset = 0) {
    try {
      // Chuyển đổi các tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      // Lấy danh sách cuộc trò chuyện
      const [conversations] = await pool.query(
        `SELECT c.*, 
           (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
           (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
         FROM conversations c
         WHERE c.user_id = ?
         ORDER BY c.updated_at DESC, c.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      // Đếm tổng số cuộc trò chuyện
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM conversations WHERE user_id = ?`,
        [userId]
      );
      
      const total = countResult[0].total;
      
      return {
        data: conversations,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          has_more: offset + conversations.length < total
        }
      };
    } catch (error) {
      console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
      throw error;
    }
  }
  
  /**
   * Lấy chi tiết một cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @param {number} userId - ID người dùng
   * @param {number} limit - Giới hạn số tin nhắn
   * @param {number} offset - Vị trí bắt đầu
   * @returns {Promise<Object>} - Thông tin cuộc trò chuyện và các tin nhắn
   */
  async getConversation(conversationId, userId, limit = 50, offset = 0) {
    try {
      // Chuyển đổi các tham số thành số
      limit = parseInt(limit) || 50;
      offset = parseInt(offset) || 0;
      
      // Kiểm tra quyền truy cập
      const [conversations] = await pool.query(
        `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
      );
      
      if (conversations.length === 0) {
        throw new Error('Cuộc trò chuyện không tồn tại hoặc không thuộc về người dùng');
      }
      
      const conversation = conversations[0];
      
      // Lấy danh sách tin nhắn
      const [messages] = await pool.query(
        `SELECT * FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );
      
      // Định dạng tin nhắn
      const formattedMessages = messages.map(message => {
        return {
          ...message,
          sources: message.sources ? JSON.parse(message.sources) : null,
          metadata: message.metadata ? JSON.parse(message.metadata) : null
        };
      });
      
      // Đếm tổng số tin nhắn
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?`,
        [conversationId]
      );
      
      const total = countResult[0].total;
      
      return {
        conversation,
        messages: formattedMessages,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + messages.length < total
        }
      };
    } catch (error) {
      console.error('Lỗi lấy chi tiết cuộc trò chuyện:', error);
      throw error;
    }
  }
  
  /**
   * Xóa cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @param {number} userId - ID người dùng
   * @returns {Promise<boolean>} - Kết quả xóa
   */
  async deleteConversation(conversationId, userId) {
    try {
      // Kiểm tra quyền xóa
      const [conversations] = await pool.query(
        `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
      );
      
      if (conversations.length === 0) {
        throw new Error('Cuộc trò chuyện không tồn tại hoặc không thuộc về người dùng');
      }
      
      // Xóa cuộc trò chuyện (tin nhắn sẽ bị xóa tự động nhờ ràng buộc CASCADE)
      await pool.query(
        `DELETE FROM conversations WHERE id = ?`,
        [conversationId]
      );
      
      return true;
    } catch (error) {
      console.error('Lỗi xóa cuộc trò chuyện:', error);
      throw error;
    }
  }
  
  /**
   * Cập nhật tiêu đề cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @param {number} userId - ID người dùng
   * @param {string} title - Tiêu đề mới
   * @returns {Promise<boolean>} - Kết quả cập nhật
   */
  async updateConversationTitle(conversationId, userId, title) {
    try {
      // Kiểm tra quyền cập nhật
      const [conversations] = await pool.query(
        `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
      );
      
      if (conversations.length === 0) {
        throw new Error('Cuộc trò chuyện không tồn tại hoặc không thuộc về người dùng');
      }
      
      // Cập nhật tiêu đề
      await pool.query(
        `UPDATE conversations
         SET title = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, conversationId]
      );
      
      return true;
    } catch (error) {
      console.error('Lỗi cập nhật tiêu đề cuộc trò chuyện:', error);
      throw error;
    }
  }
  
  /**
   * Đánh dấu/bỏ đánh dấu cuộc trò chuyện
   * @param {string} conversationId - ID cuộc trò chuyện
   * @param {number} userId - ID người dùng
   * @param {boolean} isPinned - Trạng thái đánh dấu
   * @returns {Promise<boolean>} - Kết quả cập nhật
   */
  async togglePinConversation(conversationId, userId, isPinned) {
    try {
      // Kiểm tra quyền cập nhật
      const [conversations] = await pool.query(
        `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
      );
      
      if (conversations.length === 0) {
        throw new Error('Cuộc trò chuyện không tồn tại hoặc không thuộc về người dùng');
      }
      
      // Cập nhật trạng thái đánh dấu
      await pool.query(
        `UPDATE conversations
         SET is_pinned = ?, updated_at = NOW()
         WHERE id = ?`,
        [isPinned ? 1 : 0, conversationId]
      );
      
      return true;
    } catch (error) {
      console.error('Lỗi đánh dấu cuộc trò chuyện:', error);
      throw error;
    }
  }
}

module.exports = new ChatbotService(); 