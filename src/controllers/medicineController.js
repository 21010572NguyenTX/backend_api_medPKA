const medicineModel = require('../models/medicineModel');
const translationService = require('../services/translationService');

const medicineController = {
  // Lấy danh sách thuốc
  async getAllMedicines(req, res) {
    try {
      const { limit, offset, lang = 'vi' } = req.query;
      
      const result = await medicineModel.getAll(limit, offset, lang);
      
      return res.json({
        status: 'success',
        message: 'Lấy danh sách thuốc thành công',
        data: result.data,
        pagination: result.pagination,
        language: lang
      });
    } catch (error) {
      console.error('Get all medicines error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy danh sách thuốc',
        code: 'GET_MEDICINES_ERROR'
      });
    }
  },
  
  // Lấy thông tin chi tiết thuốc
  async getMedicineById(req, res) {
    try {
      const { id } = req.params;
      const { lang = 'vi' } = req.query;
      
      const medicine = await medicineModel.getById(id, lang);
      
      if (!medicine) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy thuốc',
          code: 'MEDICINE_NOT_FOUND'
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Lấy thông tin thuốc thành công',
        data: medicine,
        language: lang
      });
    } catch (error) {
      console.error('Get medicine by id error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy thông tin thuốc',
        code: 'GET_MEDICINE_ERROR'
      });
    }
  },
  
  // Tìm kiếm thuốc
  async searchMedicines(req, res) {
    try {
      const { q, limit, offset, lang = 'vi' } = req.query;
      
      if (!q) {
        return res.status(400).json({
          status: 'error',
          message: 'Từ khóa tìm kiếm là bắt buộc',
          code: 'SEARCH_KEYWORD_REQUIRED'
        });
      }
      
      const result = await medicineModel.search(q, limit, offset, lang);
      
      return res.json({
        status: 'success',
        message: 'Tìm kiếm thuốc thành công',
        data: result.data,
        pagination: result.pagination,
        search_query: q,
        language: lang
      });
    } catch (error) {
      console.error('Search medicines error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi tìm kiếm thuốc',
        code: 'SEARCH_MEDICINES_ERROR'
      });
    }
  },
  
  // Lọc thuốc theo nhà sản xuất
  async filterByManufacturer(req, res) {
    try {
      const { manufacturer, limit, offset, lang = 'vi' } = req.query;
      
      if (!manufacturer) {
        return res.status(400).json({
          status: 'error',
          message: 'Nhà sản xuất là bắt buộc',
          code: 'MANUFACTURER_REQUIRED'
        });
      }
      
      const result = await medicineModel.filterByManufacturer(manufacturer, limit, offset, lang);
      
      return res.json({
        status: 'success',
        message: 'Lọc thuốc theo nhà sản xuất thành công',
        data: result.data,
        pagination: result.pagination,
        manufacturer,
        language: lang
      });
    } catch (error) {
      console.error('Filter by manufacturer error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lọc thuốc theo nhà sản xuất',
        code: 'FILTER_MEDICINES_ERROR'
      });
    }
  },
  
  // Admin: Thêm thuốc mới
  async createMedicine(req, res) {
    try {
      const {
        medicine_name,
        medicine_name_vi,
        composition,
        composition_vi,
        uses,
        uses_vi,
        side_effects,
        side_effects_vi,
        image_url,
        manufacturer,
        excellent_review_percent,
        average_review_percent,
        poor_review_percent
      } = req.body;
      
      if (!medicine_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Tên thuốc là bắt buộc',
          code: 'MEDICINE_NAME_REQUIRED'
        });
      }
      
      // Dịch tự động nếu cần
      let translatedData = {
        medicine_name_vi,
        composition_vi,
        uses_vi,
        side_effects_vi
      };
      
      if (!medicine_name_vi && medicine_name) {
        translatedData.medicine_name_vi = await translationService.translateToVietnamese(medicine_name);
      }
      
      if (!composition_vi && composition) {
        translatedData.composition_vi = await translationService.translateToVietnamese(composition);
      }
      
      if (!uses_vi && uses) {
        translatedData.uses_vi = await translationService.translateToVietnamese(uses);
      }
      
      if (!side_effects_vi && side_effects) {
        translatedData.side_effects_vi = await translationService.translateToVietnamese(side_effects);
      }
      
      const medicineId = await medicineModel.create({
        medicine_name,
        medicine_name_vi: translatedData.medicine_name_vi,
        composition,
        composition_vi: translatedData.composition_vi,
        uses,
        uses_vi: translatedData.uses_vi,
        side_effects,
        side_effects_vi: translatedData.side_effects_vi,
        image_url,
        manufacturer,
        excellent_review_percent,
        average_review_percent,
        poor_review_percent
      });
      
      const medicine = await medicineModel.getById(medicineId);
      
      return res.status(201).json({
        status: 'success',
        message: 'Thêm thuốc thành công',
        data: medicine
      });
    } catch (error) {
      console.error('Create medicine error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi thêm thuốc',
        code: 'CREATE_MEDICINE_ERROR'
      });
    }
  },
  
  // Admin: Cập nhật thông tin thuốc
  async updateMedicine(req, res) {
    try {
      const { id } = req.params;
      const {
        medicine_name,
        medicine_name_vi,
        composition,
        composition_vi,
        uses,
        uses_vi,
        side_effects,
        side_effects_vi,
        image_url,
        manufacturer,
        excellent_review_percent,
        average_review_percent,
        poor_review_percent
      } = req.body;
      
      // Kiểm tra thuốc tồn tại
      const medicine = await medicineModel.getById(id);
      
      if (!medicine) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy thuốc',
          code: 'MEDICINE_NOT_FOUND'
        });
      }
      
      // Kiểm tra dữ liệu cập nhật
      if (!medicine_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Tên thuốc là bắt buộc',
          code: 'MEDICINE_NAME_REQUIRED'
        });
      }
      
      // Dịch tự động nếu cần
      let translatedData = {
        medicine_name_vi: medicine_name_vi || medicine.medicine_name_vi,
        composition_vi: composition_vi || medicine.composition_vi,
        uses_vi: uses_vi || medicine.uses_vi,
        side_effects_vi: side_effects_vi || medicine.side_effects_vi
      };
      
      const needsTranslation = {
        name: medicine_name !== medicine.medicine_name,
        composition: composition !== medicine.composition,
        uses: uses !== medicine.uses,
        side_effects: side_effects !== medicine.side_effects
      };
      
      if (needsTranslation.name && !medicine_name_vi) {
        translatedData.medicine_name_vi = await translationService.translateToVietnamese(medicine_name);
      }
      
      if (needsTranslation.composition && !composition_vi) {
        translatedData.composition_vi = await translationService.translateToVietnamese(composition);
      }
      
      if (needsTranslation.uses && !uses_vi) {
        translatedData.uses_vi = await translationService.translateToVietnamese(uses);
      }
      
      if (needsTranslation.side_effects && !side_effects_vi) {
        translatedData.side_effects_vi = await translationService.translateToVietnamese(side_effects);
      }
      
      // Cập nhật
      await medicineModel.update(id, {
        medicine_name,
        medicine_name_vi: translatedData.medicine_name_vi,
        composition,
        composition_vi: translatedData.composition_vi,
        uses,
        uses_vi: translatedData.uses_vi,
        side_effects,
        side_effects_vi: translatedData.side_effects_vi,
        image_url: image_url || medicine.image_url,
        manufacturer: manufacturer || medicine.manufacturer,
        excellent_review_percent: excellent_review_percent || medicine.excellent_review_percent,
        average_review_percent: average_review_percent || medicine.average_review_percent,
        poor_review_percent: poor_review_percent || medicine.poor_review_percent
      });
      
      // Lấy thông tin đã cập nhật
      const updatedMedicine = await medicineModel.getById(id);
      
      return res.json({
        status: 'success',
        message: 'Cập nhật thuốc thành công',
        data: updatedMedicine
      });
    } catch (error) {
      console.error('Update medicine error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi cập nhật thuốc',
        code: 'UPDATE_MEDICINE_ERROR'
      });
    }
  },
  
  // Admin: Xóa thuốc
  async deleteMedicine(req, res) {
    try {
      const { id } = req.params;
      
      // Kiểm tra thuốc tồn tại
      const medicine = await medicineModel.getById(id);
      
      if (!medicine) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy thuốc',
          code: 'MEDICINE_NOT_FOUND'
        });
      }
      
      // Xóa thuốc
      await medicineModel.delete(id);
      
      return res.json({
        status: 'success',
        message: 'Xóa thuốc thành công'
      });
    } catch (error) {
      console.error('Delete medicine error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa thuốc',
        code: 'DELETE_MEDICINE_ERROR'
      });
    }
  }
};

module.exports = medicineController; 