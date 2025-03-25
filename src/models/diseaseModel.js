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
        'SELECT * FROM diseases WHERE id = ?',
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
      // Chuyển đổi các tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      const searchTerm = `%${keyword}%`;
      
      const [rows] = await pool.query(`
        SELECT * FROM diseases 
        WHERE 
          disease_name_vi LIKE ? OR
          symptoms_vi LIKE ? OR
          description_vi LIKE ?
        ORDER BY 
          CASE 
            WHEN disease_name_vi LIKE ? THEN 1
            WHEN symptoms_vi LIKE ? THEN 2
            ELSE 3
          END,
          id DESC
        LIMIT ? OFFSET ?
      `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM diseases
        WHERE 
          disease_name_vi LIKE ? OR
          symptoms_vi LIKE ? OR
          description_vi LIKE ?
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
      console.error('Search diseases error:', error);
      throw error;
    }
  }
  
  // Tìm bệnh theo triệu chứng
  async findBySymptoms(symptoms, limit = 10, offset = 0) {
    try {
      // Chuyển đổi các tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      // Xây dựng điều kiện tìm kiếm cho mỗi triệu chứng
      const conditions = symptoms.map(() => 'symptoms_vi LIKE ?').join(' AND ');
      const searchTerms = symptoms.map(s => `%${s}%`);
      
      const [rows] = await pool.query(`
        SELECT * FROM diseases 
        WHERE ${conditions}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [...searchTerms, limit, offset]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM diseases
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
      console.error('Find by symptoms error:', error);
      throw error;
    }
  }
  
  // Admin: Thêm bệnh mới
  async create(data) {
    try {
      const { 
        disease_name, 
        disease_name_vi, 
        description, 
        description_vi, 
        causes, 
        causes_vi, 
        symptoms, 
        symptoms_vi, 
        risk_factors, 
        risk_factors_vi, 
        prevention, 
        prevention_vi, 
        treatment, 
        treatment_vi 
      } = data;
      
      const [result] = await pool.query(`
        INSERT INTO diseases 
        (disease_name, disease_name_vi, description, description_vi, 
         causes, causes_vi, symptoms, symptoms_vi, risk_factors, risk_factors_vi, 
         prevention, prevention_vi, treatment, treatment_vi) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        disease_name, disease_name_vi, description, description_vi, 
        causes, causes_vi, symptoms, symptoms_vi, risk_factors, risk_factors_vi, 
        prevention, prevention_vi, treatment, treatment_vi
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Create disease error:', error);
      throw error;
    }
  }
  
  // Admin: Cập nhật thông tin bệnh
  async update(id, data) {
    try {
      const { 
        disease_name, 
        disease_name_vi, 
        description, 
        description_vi, 
        causes, 
        causes_vi, 
        symptoms, 
        symptoms_vi, 
        risk_factors, 
        risk_factors_vi, 
        prevention, 
        prevention_vi, 
        treatment, 
        treatment_vi 
      } = data;
      
      await pool.query(`
        UPDATE diseases 
        SET 
          disease_name = ?,
          disease_name_vi = ?,
          description = ?,
          description_vi = ?,
          causes = ?,
          causes_vi = ?,
          symptoms = ?,
          symptoms_vi = ?,
          risk_factors = ?,
          risk_factors_vi = ?,
          prevention = ?,
          prevention_vi = ?,
          treatment = ?,
          treatment_vi = ?
        WHERE id = ?
      `, [
        disease_name, disease_name_vi, description, description_vi, 
        causes, causes_vi, symptoms, symptoms_vi, risk_factors, risk_factors_vi, 
        prevention, prevention_vi, treatment, treatment_vi, id
      ]);
      
      return true;
    } catch (error) {
      console.error('Update disease error:', error);
      throw error;
    }
  }
  
  // Admin: Xóa bệnh
  async delete(id) {
    try {
      await pool.query('DELETE FROM diseases WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DiseaseModel(); 