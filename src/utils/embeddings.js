const axios = require('axios');
const { pool } = require('../config/database');

/**
 * Lớp Embeddings cung cấp các phương thức để tạo và tìm kiếm vector embeddings
 */
class Embeddings {
  /**
   * Tạo vector embedding từ văn bản
   * @param {string} text - Văn bản đầu vào
   * @returns {Promise<Array|null>} - Vector embedding hoặc null nếu có lỗi
   */
  async createEmbedding(text) {
    try {
      const response = await axios.post(
        process.env.EMBEDDING_API_URL,
        {
          input: text,
          model: process.env.EMBEDDING_MODEL || "text-embedding-ada-002"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          timeout: 10000 // Timeout 10 giây
        }
      );
      
      // Trả về vector embedding
      if (response.data && response.data.data && response.data.data[0].embedding) {
        return response.data.data[0].embedding;
      }
      
      return null;
    } catch (error) {
      console.error('Lỗi tạo embedding:', error.message);
      return null;
    }
  }
  
  /**
   * Tính toán độ tương đồng cosine giữa hai vector
   * @param {Array} vec1 - Vector thứ nhất
   * @param {Array} vec2 - Vector thứ hai
   * @returns {number} - Độ tương đồng cosine (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }
  
  /**
   * Tìm kiếm các nội dung liên quan dựa trên embedding
   * @param {string} query - Câu truy vấn
   * @param {string} contentType - Loại nội dung để tìm kiếm ('disease', 'medicine', hoặc 'all')
   * @param {number} limit - Số lượng kết quả tối đa
   * @param {number} threshold - Ngưỡng tương đồng (0-1)
   * @returns {Promise<Array>} - Danh sách các kết quả phù hợp
   */
  async search(query, contentType = 'all', limit = 3, threshold = 0.7) {
    try {
      // Tạo embedding cho câu truy vấn
      const queryEmbedding = await this.createEmbedding(query);
      
      if (!queryEmbedding) {
        return [];
      }
      
      // Lấy tất cả embeddings từ cơ sở dữ liệu
      let sql = `
        SELECT ve.id, ve.content_type, ve.content_id, ve.content, ve.embedding,
               CASE 
                 WHEN ve.content_type = 'disease' THEN d.disease_name
                 WHEN ve.content_type = 'medicine' THEN m.medicine_name
               END AS name,
               CASE 
                 WHEN ve.content_type = 'disease' THEN d.disease_name_vi
                 WHEN ve.content_type = 'medicine' THEN m.medicine_name_vi
               END AS name_vi
        FROM vector_embeddings ve
        LEFT JOIN diseases d ON ve.content_type = 'disease' AND ve.content_id = d.id
        LEFT JOIN medicines m ON ve.content_type = 'medicine' AND ve.content_id = m.id
      `;
      
      // Lọc theo loại nội dung nếu cần
      if (contentType !== 'all') {
        sql += ` WHERE ve.content_type = ?`;
      }
      
      const params = contentType !== 'all' ? [contentType] : [];
      const [embeddings] = await pool.query(sql, params);
      
      // So sánh độ tương đồng và xếp hạng kết quả
      const results = embeddings.map(item => {
        const itemEmbedding = JSON.parse(item.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, itemEmbedding);
        
        return {
          id: item.content_id,
          type: item.content_type,
          name: item.name,
          name_vi: item.name_vi,
          content: item.content,
          similarity
        };
      });
      
      // Lọc và sắp xếp kết quả theo độ tương đồng
      return results
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Lỗi tìm kiếm embedding:', error);
      return [];
    }
  }
  
  /**
   * Lấy chi tiết đầy đủ về bệnh lý hoặc thuốc dựa trên kết quả tìm kiếm
   * @param {Array} searchResults - Kết quả tìm kiếm từ phương thức search
   * @returns {Promise<Array>} - Thông tin chi tiết về các kết quả tìm kiếm
   */
  async getDetailedResults(searchResults) {
    try {
      const detailedResults = [];
      
      for (const result of searchResults) {
        let detailedData = null;
        
        if (result.type === 'disease') {
          // Lấy thông tin chi tiết về bệnh lý
          const [diseases] = await pool.query(
            'SELECT * FROM diseases WHERE id = ?',
            [result.id]
          );
          
          if (diseases.length > 0) {
            detailedData = {
              ...result,
              detail: diseases[0]
            };
          }
        } else if (result.type === 'medicine') {
          // Lấy thông tin chi tiết về thuốc
          const [medicines] = await pool.query(
            'SELECT * FROM medicines WHERE id = ?',
            [result.id]
          );
          
          if (medicines.length > 0) {
            detailedData = {
              ...result,
              detail: medicines[0]
            };
          }
        }
        
        if (detailedData) {
          detailedResults.push(detailedData);
        }
      }
      
      return detailedResults;
    } catch (error) {
      console.error('Lỗi lấy chi tiết kết quả:', error);
      return searchResults;
    }
  }
}

module.exports = new Embeddings(); 