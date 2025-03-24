const embeddings = require('../utils/embeddings');
const { pool } = require('../config/database');
const translationService = require('./translationService');

class EmbeddingService {
  /**
   * Tìm kiếm nội dung liên quan đến câu hỏi của người dùng
   * @param {string} question - Câu hỏi của người dùng
   * @param {string} language - Ngôn ngữ ('en' hoặc 'vi')
   * @returns {Promise<Array>} - Danh sách kết quả tìm kiếm
   */
  async findRelevantContent(question, language = 'vi') {
    try {
      // Nếu câu hỏi bằng tiếng Việt, dịch sang tiếng Anh để cải thiện kết quả tìm kiếm
      let searchQuery = question;
      if (language === 'vi') {
        const englishQuestion = await translationService.translateToEnglish(question);
        // Kết hợp cả hai câu hỏi để tìm kiếm
        searchQuery = `${englishQuestion} ${question}`;
      }
      
      // Tìm kiếm nội dung liên quan dựa trên vector embeddings
      const searchResults = await embeddings.search(searchQuery, 'all', 5, 0.6);
      
      // Lấy chi tiết đầy đủ từ database
      return await embeddings.getDetailedResults(searchResults);
    } catch (error) {
      console.error('Lỗi tìm kiếm nội dung liên quan:', error);
      return [];
    }
  }
  
  /**
   * Tạo ngữ cảnh từ nội dung liên quan
   * @param {Array} contents - Danh sách nội dung liên quan
   * @param {string} language - Ngôn ngữ ('en' hoặc 'vi')
   * @returns {string} - Ngữ cảnh để truyền vào API
   */
  createContextFromContent(contents, language = 'vi') {
    if (!contents || contents.length === 0) {
      return '';
    }
    
    let context = '';
    
    contents.forEach((item, index) => {
      if (item.type === 'disease') {
        const disease = item.detail;
        context += language === 'vi' ? 
          `\n--- BỆNH ${index + 1} ---\n` : 
          `\n--- DISEASE ${index + 1} ---\n`;
          
        context += language === 'vi' ? 
          `Tên: ${disease.disease_name_vi}\n` + 
          `Mô tả: ${disease.description_vi}\n` + 
          `Triệu chứng: ${disease.symptoms_vi}\n` + 
          `Nguyên nhân: ${disease.causes_vi}\n` + 
          `Phòng ngừa: ${disease.prevention_vi}\n` : 
          `Name: ${disease.disease_name}\n` + 
          `Description: ${disease.description}\n` + 
          `Symptoms: ${disease.symptoms}\n` + 
          `Causes: ${disease.causes}\n` + 
          `Prevention: ${disease.prevention}\n`;
      } else if (item.type === 'medicine') {
        const medicine = item.detail;
        context += language === 'vi' ? 
          `\n--- THUỐC ${index + 1} ---\n` : 
          `\n--- MEDICINE ${index + 1} ---\n`;
          
        context += language === 'vi' ? 
          `Tên: ${medicine.medicine_name_vi}\n` + 
          `Mô tả: ${medicine.description_vi}\n` + 
          `Cách dùng: ${medicine.usage_vi}\n` + 
          `Tác dụng phụ: ${medicine.side_effects_vi}\n` + 
          `Nhà sản xuất: ${medicine.manufacturer_vi || medicine.manufacturer}\n` : 
          `Name: ${medicine.medicine_name}\n` + 
          `Description: ${medicine.description}\n` + 
          `Usage: ${medicine.usage}\n` + 
          `Side Effects: ${medicine.side_effects}\n` + 
          `Manufacturer: ${medicine.manufacturer}\n`;
      }
    });
    
    return context;
  }
  
  /**
   * Tạo prompt cho AI dựa trên ngữ cảnh và câu hỏi
   * @param {string} question - Câu hỏi của người dùng
   * @param {string} context - Ngữ cảnh từ cơ sở dữ liệu
   * @param {string} language - Ngôn ngữ ('en' hoặc 'vi')
   * @returns {string} - Prompt đầy đủ
   */
  createPrompt(question, context, language = 'vi') {
    // Tạo hướng dẫn dựa trên ngôn ngữ
    const systemPrompt = language === 'vi' ? 
      `Bạn là trợ lý AI của MedCure, một ứng dụng tra cứu thông tin y tế. Hãy trả lời câu hỏi của người dùng dựa trên thông tin được cung cấp bên dưới. 
      Nếu thông tin không đủ để trả lời câu hỏi, hãy cho biết bạn không có đủ thông tin và gợi ý những câu hỏi khác liên quan.
      Hãy trả lời bằng tiếng Việt rõ ràng, chính xác và dễ hiểu. Không cần nêu nguồn hoặc giải thích cách bạn tìm thông tin.
      Không bịa đặt thông tin mà chỉ sử dụng thông tin được cung cấp. Nếu có nhiều nguồn thông tin, hãy kết hợp chúng để tạo câu trả lời tổng hợp.
      Trả lời ngắn gọn (tối đa 3-4 đoạn), đi thẳng vào vấn đề và dễ hiểu.` :
      `You are the AI assistant for MedCure, a medical information lookup app. Answer the user's question based on the information provided below.
      If the information is not sufficient to answer the question, state that you don't have enough information and suggest some related questions.
      Please answer in English clearly, accurately, and understandably. No need to cite sources or explain how you found the information.
      Do not fabricate information and only use the information provided. If there are multiple sources of information, combine them to create a synthesized answer.
      Keep your answer concise (maximum 3-4 paragraphs), straight to the point, and easy to understand.`;
      
    // Nếu không có ngữ cảnh, sử dụng prompt đơn giản
    if (!context) {
      const noContextPrompt = language === 'vi' ?
        `Tôi không có thông tin cụ thể để trả lời câu hỏi của bạn về "${question}". Vui lòng thử lại với một câu hỏi khác hoặc cung cấp thêm chi tiết.` :
        `I don't have specific information to answer your question about "${question}". Please try again with a different question or provide more details.`;
        
      return `${systemPrompt}\n\nCâu hỏi: ${question}\n\nTrả lời: ${noContextPrompt}`;
    }
    
    // Tạo prompt đầy đủ với ngữ cảnh
    return `${systemPrompt}\n\nTHÔNG TIN:\n${context}\n\nCâu hỏi: ${question}\n\nTrả lời:`;
  }
  
  /**
   * Kiểm tra cài đặt API DeepSeek
   * @returns {boolean} - true nếu cài đặt đúng, false nếu không
   */
  isDeepSeekConfigured() {
    return Boolean(
      process.env.DEEPSEEK_API_KEY && 
      process.env.DEEPSEEK_API_URL
    );
  }
}

module.exports = new EmbeddingService(); 