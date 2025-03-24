const { pool } = require('../config/database');
const axios = require('axios');

/**
 * Job cập nhật embeddings cho dữ liệu bệnh lý và thuốc
 * Job này nên được chạy theo lịch, ví dụ: mỗi ngày một lần
 * Sử dụng: node src/jobs/updateEmbeddings.js
 */
async function updateEmbeddings() {
  console.log('🔄 Bắt đầu cập nhật embeddings...');
  
  try {
    // Lấy tất cả bệnh lý và thuốc chưa có embedding hoặc đã được cập nhật
    console.log('📊 Đang lấy dữ liệu cần cập nhật...');
    
    // Bước 1: Lấy dữ liệu bệnh lý cần cập nhật
    const [diseases] = await pool.query(`
      SELECT d.id, d.disease_name, d.disease_name_vi, d.description, d.description_vi, d.symptoms, d.symptoms_vi
      FROM diseases d
      LEFT JOIN vector_embeddings v ON v.content_id = d.id AND v.content_type = 'disease'
      WHERE v.id IS NULL OR d.updated_at > v.updated_at
    `);
    
    // Bước 2: Lấy dữ liệu thuốc cần cập nhật
    const [medicines] = await pool.query(`
      SELECT m.id, m.medicine_name, m.medicine_name_vi, m.description, m.description_vi, 
             m.usage, m.usage_vi, m.side_effects, m.side_effects_vi
      FROM medicines m
      LEFT JOIN vector_embeddings v ON v.content_id = m.id AND v.content_type = 'medicine'
      WHERE v.id IS NULL OR m.updated_at > v.updated_at
    `);
    
    console.log(`🔍 Tìm thấy ${diseases.length} bệnh lý và ${medicines.length} thuốc cần cập nhật`);
    
    // Bước 3: Cập nhật embeddings cho bệnh lý
    if (diseases.length > 0) {
      console.log('🧠 Đang cập nhật embeddings cho bệnh lý...');
      
      for (const disease of diseases) {
        // Tạo text từ thông tin bệnh lý (bao gồm cả tiếng Anh và tiếng Việt)
        const englishText = `Disease: ${disease.disease_name}\nDescription: ${disease.description}\nSymptoms: ${disease.symptoms}`;
        const vietnameseText = `Bệnh: ${disease.disease_name_vi}\nMô tả: ${disease.description_vi}\nTriệu chứng: ${disease.symptoms_vi}`;
        const content = `${englishText}\n\n${vietnameseText}`;
        
        // Lấy embedding từ API
        const embedding = await getEmbedding(content);
        
        if (embedding) {
          // Lưu hoặc cập nhật embedding trong cơ sở dữ liệu
          await saveEmbedding('disease', disease.id, content, embedding);
          console.log(`✅ Đã cập nhật embedding cho bệnh: ${disease.disease_name}`);
        } else {
          console.log(`❌ Không thể tạo embedding cho bệnh: ${disease.disease_name}`);
        }
        
        // Thêm độ trễ để tránh giới hạn tốc độ API
        await sleep(200);
      }
    }
    
    // Bước 4: Cập nhật embeddings cho thuốc
    if (medicines.length > 0) {
      console.log('🧠 Đang cập nhật embeddings cho thuốc...');
      
      for (const medicine of medicines) {
        // Tạo text từ thông tin thuốc (bao gồm cả tiếng Anh và tiếng Việt)
        const englishText = `Medicine: ${medicine.medicine_name}\nDescription: ${medicine.description}\nUsage: ${medicine.usage}\nSide Effects: ${medicine.side_effects}`;
        const vietnameseText = `Thuốc: ${medicine.medicine_name_vi}\nMô tả: ${medicine.description_vi}\nCách dùng: ${medicine.usage_vi}\nTác dụng phụ: ${medicine.side_effects_vi}`;
        const content = `${englishText}\n\n${vietnameseText}`;
        
        // Lấy embedding từ API
        const embedding = await getEmbedding(content);
        
        if (embedding) {
          // Lưu hoặc cập nhật embedding trong cơ sở dữ liệu
          await saveEmbedding('medicine', medicine.id, content, embedding);
          console.log(`✅ Đã cập nhật embedding cho thuốc: ${medicine.medicine_name}`);
        } else {
          console.log(`❌ Không thể tạo embedding cho thuốc: ${medicine.medicine_name}`);
        }
        
        // Thêm độ trễ để tránh giới hạn tốc độ API
        await sleep(200);
      }
    }
    
    console.log('✅ Hoàn thành cập nhật embeddings!');
  } catch (error) {
    console.error('❌ Lỗi cập nhật embeddings:', error);
  } finally {
    // Đóng kết nối
    pool.end();
  }
}

/**
 * Hàm lấy vector embedding từ API
 * @param {string} text - Văn bản để lấy embedding
 * @returns {Array|null} - Vector embedding hoặc null nếu có lỗi
 */
async function getEmbedding(text) {
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
    console.error('Lỗi lấy embedding:', error.message);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật embedding vào cơ sở dữ liệu
 * @param {string} contentType - Loại nội dung ('disease' hoặc 'medicine')
 * @param {number} contentId - ID của nội dung
 * @param {string} content - Nội dung văn bản đầy đủ
 * @param {Array} embedding - Vector embedding
 */
async function saveEmbedding(contentType, contentId, content, embedding) {
  try {
    // Kiểm tra embedding đã tồn tại chưa
    const [exists] = await pool.query(
      'SELECT id FROM vector_embeddings WHERE content_type = ? AND content_id = ?',
      [contentType, contentId]
    );
    
    const embeddingString = JSON.stringify(embedding);
    
    if (exists.length > 0) {
      // Cập nhật embedding hiện có
      await pool.query(
        `UPDATE vector_embeddings 
         SET content = ?, embedding = ?, updated_at = NOW() 
         WHERE content_type = ? AND content_id = ?`,
        [content, embeddingString, contentType, contentId]
      );
    } else {
      // Tạo embedding mới
      await pool.query(
        `INSERT INTO vector_embeddings 
         (content_type, content_id, content, embedding, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [contentType, contentId, content, embeddingString]
      );
    }
  } catch (error) {
    console.error(`Lỗi lưu embedding cho ${contentType} ID ${contentId}:`, error);
    throw error;
  }
}

/**
 * Hàm tạm dừng thực thi trong một số mili giây
 * @param {number} ms - Số mili giây cần tạm dừng
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Chạy job cập nhật embeddings
updateEmbeddings(); 