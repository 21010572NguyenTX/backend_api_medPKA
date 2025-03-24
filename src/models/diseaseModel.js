const { pool } = require('../config/database');

class DiseaseModel {
  // Lấy danh sách tất cả bệnh
  async getAll(limit = 10, offset = 0) {
    try {
      // Chuyển đổi các tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      const [rows] = await pool.query(`
        SELECT * FROM diseases
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM diseases');
      const total = countResult[0].total;
      
      return {
        data: rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Lấy thông tin một bệnh theo ID
  async getById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM disease WHERE id = ?',
        [id]
      );
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm kiếm bệnh theo từ khóa
  async search(keyword, limit = 10, offset = 0) {
    try {
      const searchTerm = `%${keyword}%`;
      
      const [rows] = await pool.query(`
        SELECT * FROM disease 
        WHERE 
          ten_benh LIKE ? OR
          trieu_chung LIKE ? OR
          dinh_nghia LIKE ?
        ORDER BY 
          CASE 
            WHEN ten_benh LIKE ? THEN 1
            WHEN trieu_chung LIKE ? THEN 2
            ELSE 3
          END,
          id DESC
        LIMIT ? OFFSET ?
      `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM disease
        WHERE 
          ten_benh LIKE ? OR
          trieu_chung LIKE ? OR
          dinh_nghia LIKE ?
      `, [searchTerm, searchTerm, searchTerm]);
      
      const total = countResult[0].total;
      
      return {
        data: rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm bệnh theo triệu chứng
  async findBySymptoms(symptoms, limit = 10, offset = 0) {
    try {
      // Xây dựng điều kiện tìm kiếm cho mỗi triệu chứng
      const conditions = symptoms.map(() => 'trieu_chung LIKE ?').join(' AND ');
      const searchTerms = symptoms.map(s => `%${s}%`);
      
      const [rows] = await pool.query(`
        SELECT * FROM disease 
        WHERE ${conditions}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [...searchTerms, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM disease
        WHERE ${conditions}
      `, searchTerms);
      
      const total = countResult[0].total;
      
      return {
        data: rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Admin: Thêm bệnh mới
  async create(data) {
    try {
      const { ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri } = data;
      
      const [result] = await pool.query(`
        INSERT INTO disease 
        (ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri]);
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
  
  // Admin: Cập nhật thông tin bệnh
  async update(id, data) {
    try {
      const { ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri } = data;
      
      await pool.query(`
        UPDATE disease 
        SET 
          ten_benh = ?,
          dinh_nghia = ?,
          nguyen_nhan = ?,
          trieu_chung = ?,
          chan_doan = ?,
          dieu_tri = ?
        WHERE id = ?
      `, [ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri, id]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Admin: Xóa bệnh
  async delete(id) {
    try {
      await pool.query('DELETE FROM disease WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DiseaseModel(); 