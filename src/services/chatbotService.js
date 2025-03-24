const axios = require('axios');
const { pool } = require('../config/database');
const embeddingService = require('./embeddingService');
const translationService = require('./translationService');

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
   * Lưu lịch sử chat vào database
   * @param {number} userId - ID người dùng
   * @param {string} question - Câu hỏi
   * @param {string} answer - Câu trả lời
   * @param {Array} sources - Nguồn thông tin
   * @returns {Promise<boolean>} - true nếu thành công, false nếu thất bại
   */
  async saveChat(userId, question, answer, sources = []) {
    try {
      // Chuyển danh sách nguồn thành JSON string
      const sourcesJSON = JSON.stringify(sources);
      
      // Lưu vào bảng chat_history
      await pool.query(
        `INSERT INTO chat_history (user_id, question, answer, sources)
         VALUES (?, ?, ?, ?)`,
        [userId, question, answer, sourcesJSON]
      );
      
      return true;
    } catch (error) {
      console.error('Lỗi lưu lịch sử chat:', error);
      return false;
    }
  }
  
  /**
   * Lấy lịch sử chat của người dùng
   * @param {number} userId - ID người dùng
   * @param {number} limit - Giới hạn số bản ghi
   * @param {number} offset - Vị trí bắt đầu
   * @returns {Promise<Object>} - Lịch sử chat và thông tin phân trang
   */
  async getUserChatHistory(userId, limit = 10, offset = 0) {
    try {
      // Lấy lịch sử chat
      const [history] = await pool.query(
        `SELECT * FROM chat_history 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, Number(limit), Number(offset)]
      );
      
      // Chuyển đổi sources từ JSON string sang object
      const data = history.map(item => {
        return {
          ...item,
          sources: JSON.parse(item.sources || '[]')
        };
      });
      
      // Đếm tổng số bản ghi
      const [totalResult] = await pool.query(
        `SELECT COUNT(*) AS total 
         FROM chat_history 
         WHERE user_id = ?`,
        [userId]
      );
      
      const total = totalResult[0].total;
      
      return {
        data,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          has_more: Number(offset) + data.length < total
        }
      };
    } catch (error) {
      console.error('Lỗi lấy lịch sử chat:', error);
      return { data: [], pagination: { total: 0, limit, offset, has_more: false } };
    }
  }
}

module.exports = new ChatbotService(); 