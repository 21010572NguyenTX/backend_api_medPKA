const { pool } = require('../config/database');

class MedicineModel {
  // Lấy danh sách thuốc với phân trang
  async getAll(limit = 10, offset = 0, lang = 'vi') {
    try {
      // Chuyển đổi tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      const [rows] = await pool.query(`
        SELECT 
          id,
          medicine_name,
          medicine_name_vi,
          description,
          description_vi,
          dosage,
          dosage_vi,
          \`usage\`,
          usage_vi,
          side_effects,
          side_effects_vi,
          composition,
          composition_vi,
          manufacturer,
          manufacturer_vi,
          image_url
        FROM medicines
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM medicines');
      const total = countResult[0].total;
      
      // Format theo ngôn ngữ
      const formattedData = rows.map(medicine => this.formatMedicine(medicine, lang));
      
      return {
        data: formattedData,
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
  
  // Lấy thông tin thuốc theo ID
  async getById(id, lang = 'vi') {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id,
          medicine_name,
          medicine_name_vi,
          description,
          description_vi,
          dosage,
          dosage_vi,
          \`usage\`,
          usage_vi,
          side_effects,
          side_effects_vi,
          composition,
          composition_vi,
          manufacturer,
          manufacturer_vi,
          image_url
        FROM medicines 
        WHERE id = ?
      `, [id]);
      
      if (!rows[0]) return null;
      
      return this.formatMedicine(rows[0], lang);
    } catch (error) {
      throw error;
    }
  }
  
  // Tìm kiếm thuốc
  async search(keyword, limit = 10, offset = 0, lang = 'vi') {
    try {
      // Chuyển đổi tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      const searchTerm = `%${keyword}%`;
      
      const [rows] = await pool.query(`
        SELECT 
          id,
          medicine_name,
          medicine_name_vi,
          description,
          description_vi,
          dosage,
          dosage_vi,
          \`usage\`,
          usage_vi,
          side_effects,
          side_effects_vi,
          composition,
          composition_vi,
          manufacturer,
          manufacturer_vi,
          image_url
        FROM medicines 
        WHERE 
          medicine_name LIKE ? OR
          medicine_name_vi LIKE ? OR
          composition LIKE ? OR
          composition_vi LIKE ? OR
          \`usage\` LIKE ? OR
          usage_vi LIKE ? OR
          manufacturer LIKE ?
        ORDER BY 
          CASE 
            WHEN medicine_name = ? THEN 1
            WHEN medicine_name_vi = ? THEN 1
            WHEN medicine_name LIKE ? THEN 2
            WHEN medicine_name_vi LIKE ? THEN 2
            ELSE 3
          END,
          id DESC
        LIMIT ? OFFSET ?
      `, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
        keyword, keyword, `${keyword}%`, `${keyword}%`,
        limit, offset
      ]);
      
      const [countResult] = await pool.query(`
        SELECT COUNT(*) as total 
        FROM medicines
        WHERE 
          medicine_name LIKE ? OR
          medicine_name_vi LIKE ? OR
          composition LIKE ? OR
          composition_vi LIKE ? OR
          \`usage\` LIKE ? OR
          usage_vi LIKE ? OR
          manufacturer LIKE ?
      `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
      
      const total = countResult[0].total;
      
      // Format theo ngôn ngữ
      const formattedData = rows.map(medicine => this.formatMedicine(medicine, lang));
      
      return {
        data: formattedData,
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
  
  // Lọc thuốc theo nhà sản xuất
  async filterByManufacturer(manufacturer, limit = 10, offset = 0, lang = 'vi') {
    try {
      // Chuyển đổi tham số thành số
      limit = parseInt(limit) || 10;
      offset = parseInt(offset) || 0;
      
      const [rows] = await pool.query(`
        SELECT 
          id,
          medicine_name,
          medicine_name_vi,
          description,
          description_vi,
          dosage,
          dosage_vi,
          \`usage\`,
          usage_vi,
          side_effects,
          side_effects_vi,
          composition,
          composition_vi,
          manufacturer,
          manufacturer_vi,
          image_url
        FROM medicines 
        WHERE manufacturer = ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [manufacturer, limit, offset]);
      
      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM medicines WHERE manufacturer = ?',
        [manufacturer]
      );
      
      const total = countResult[0].total;
      
      // Format theo ngôn ngữ
      const formattedData = rows.map(medicine => this.formatMedicine(medicine, lang));
      
      return {
        data: formattedData,
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
  
  // Admin: Thêm thuốc mới
  async create(data) {
    try {
      const {
        medicine_name,
        medicine_name_vi,
        description,
        description_vi,
        dosage,
        dosage_vi,
        usage,
        usage_vi,
        side_effects,
        side_effects_vi,
        composition,
        composition_vi,
        manufacturer,
        manufacturer_vi,
        image_url
      } = data;
      
      const [result] = await pool.query(`
        INSERT INTO medicines (
          medicine_name,
          medicine_name_vi,
          description,
          description_vi,
          dosage,
          dosage_vi,
          \`usage\`,
          usage_vi,
          side_effects,
          side_effects_vi,
          composition,
          composition_vi,
          manufacturer,
          manufacturer_vi,
          image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        medicine_name,
        medicine_name_vi,
        description,
        description_vi,
        dosage,
        dosage_vi,
        usage,
        usage_vi,
        side_effects,
        side_effects_vi,
        composition,
        composition_vi,
        manufacturer,
        manufacturer_vi,
        image_url
      ]);
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
  
  // Admin: Cập nhật thông tin thuốc
  async update(id, data) {
    try {
      const {
        medicine_name,
        medicine_name_vi,
        description,
        description_vi,
        dosage,
        dosage_vi,
        usage,
        usage_vi,
        side_effects,
        side_effects_vi,
        composition,
        composition_vi,
        manufacturer,
        manufacturer_vi,
        image_url
      } = data;
      
      await pool.query(`
        UPDATE medicines 
        SET 
          medicine_name = ?,
          medicine_name_vi = ?,
          description = ?,
          description_vi = ?,
          dosage = ?,
          dosage_vi = ?,
          \`usage\` = ?,
          usage_vi = ?,
          side_effects = ?,
          side_effects_vi = ?,
          composition = ?,
          composition_vi = ?,
          manufacturer = ?,
          manufacturer_vi = ?,
          image_url = ?
        WHERE id = ?
      `, [
        medicine_name,
        medicine_name_vi,
        description,
        description_vi,
        dosage,
        dosage_vi,
        usage,
        usage_vi,
        side_effects,
        side_effects_vi,
        composition,
        composition_vi,
        manufacturer,
        manufacturer_vi,
        image_url,
        id
      ]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Admin: Xóa thuốc
  async delete(id) {
    try {
      await pool.query('DELETE FROM medicines WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Helper: Format thuốc theo ngôn ngữ
  formatMedicine(medicine, lang = 'vi') {
    return {
      id: medicine.id,
      name: lang === 'vi' && medicine.medicine_name_vi ? medicine.medicine_name_vi : medicine.medicine_name,
      description: lang === 'vi' && medicine.description_vi ? medicine.description_vi : medicine.description,
      dosage: lang === 'vi' && medicine.dosage_vi ? medicine.dosage_vi : medicine.dosage,
      usage: lang === 'vi' && medicine.usage_vi ? medicine.usage_vi : medicine.usage,
      side_effects: lang === 'vi' && medicine.side_effects_vi ? medicine.side_effects_vi : medicine.side_effects,
      composition: lang === 'vi' && medicine.composition_vi ? medicine.composition_vi : medicine.composition,
      manufacturer: lang === 'vi' && medicine.manufacturer_vi ? medicine.manufacturer_vi : medicine.manufacturer,
      image_url: medicine.image_url,
      translations_available: {
        name: !!medicine.medicine_name_vi,
        description: !!medicine.description_vi,
        dosage: !!medicine.dosage_vi,
        usage: !!medicine.usage_vi,
        side_effects: !!medicine.side_effects_vi,
        composition: !!medicine.composition_vi,
        manufacturer: !!medicine.manufacturer_vi
      }
    };
  }
}

module.exports = new MedicineModel(); 