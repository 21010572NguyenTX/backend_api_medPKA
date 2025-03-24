const diseaseModel = require('../models/diseaseModel');

const diseaseController = {
  // Lấy danh sách bệnh
  async getAllDiseases(req, res) {
    try {
      const { limit, offset } = req.query;
      
      const result = await diseaseModel.getAll(limit, offset);
      
      return res.json({
        status: 'success',
        message: 'Lấy danh sách bệnh thành công',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all diseases error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy danh sách bệnh',
        code: 'GET_DISEASES_ERROR'
      });
    }
  },
  
  // Lấy thông tin chi tiết bệnh
  async getDiseaseById(req, res) {
    try {
      const { id } = req.params;
      
      const disease = await diseaseModel.getById(id);
      
      if (!disease) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy bệnh',
          code: 'DISEASE_NOT_FOUND'
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Lấy thông tin bệnh thành công',
        data: disease
      });
    } catch (error) {
      console.error('Get disease by id error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy thông tin bệnh',
        code: 'GET_DISEASE_ERROR'
      });
    }
  },
  
  // Tìm kiếm bệnh
  async searchDiseases(req, res) {
    try {
      const { q, limit, offset } = req.query;
      
      if (!q) {
        return res.status(400).json({
          status: 'error',
          message: 'Từ khóa tìm kiếm là bắt buộc',
          code: 'SEARCH_KEYWORD_REQUIRED'
        });
      }
      
      const result = await diseaseModel.search(q, limit, offset);
      
      return res.json({
        status: 'success',
        message: 'Tìm kiếm bệnh thành công',
        data: result.data,
        pagination: result.pagination,
        search_query: q
      });
    } catch (error) {
      console.error('Search diseases error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi tìm kiếm bệnh',
        code: 'SEARCH_DISEASES_ERROR'
      });
    }
  },
  
  // Tìm bệnh theo triệu chứng
  async findBySymptoms(req, res) {
    try {
      const { symptoms, limit, offset } = req.body;
      
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Danh sách triệu chứng không hợp lệ',
          code: 'INVALID_SYMPTOMS'
        });
      }
      
      const result = await diseaseModel.findBySymptoms(symptoms, limit, offset);
      
      return res.json({
        status: 'success',
        message: 'Tìm bệnh theo triệu chứng thành công',
        data: result.data,
        pagination: result.pagination,
        symptoms
      });
    } catch (error) {
      console.error('Find by symptoms error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi tìm bệnh theo triệu chứng',
        code: 'FIND_BY_SYMPTOMS_ERROR'
      });
    }
  },
  
  // Admin: Thêm bệnh mới
  async createDisease(req, res) {
    try {
      const { ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri } = req.body;
      
      if (!ten_benh) {
        return res.status(400).json({
          status: 'error',
          message: 'Tên bệnh là bắt buộc',
          code: 'DISEASE_NAME_REQUIRED'
        });
      }
      
      const diseaseId = await diseaseModel.create({
        ten_benh,
        dinh_nghia,
        nguyen_nhan,
        trieu_chung,
        chan_doan,
        dieu_tri
      });
      
      const disease = await diseaseModel.getById(diseaseId);
      
      return res.status(201).json({
        status: 'success',
        message: 'Thêm bệnh thành công',
        data: disease
      });
    } catch (error) {
      console.error('Create disease error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi thêm bệnh',
        code: 'CREATE_DISEASE_ERROR'
      });
    }
  },
  
  // Admin: Cập nhật thông tin bệnh
  async updateDisease(req, res) {
    try {
      const { id } = req.params;
      const { ten_benh, dinh_nghia, nguyen_nhan, trieu_chung, chan_doan, dieu_tri } = req.body;
      
      // Kiểm tra bệnh tồn tại
      const disease = await diseaseModel.getById(id);
      
      if (!disease) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy bệnh',
          code: 'DISEASE_NOT_FOUND'
        });
      }
      
      // Kiểm tra dữ liệu cập nhật
      if (!ten_benh) {
        return res.status(400).json({
          status: 'error',
          message: 'Tên bệnh là bắt buộc',
          code: 'DISEASE_NAME_REQUIRED'
        });
      }
      
      // Cập nhật
      await diseaseModel.update(id, {
        ten_benh,
        dinh_nghia: dinh_nghia || disease.dinh_nghia,
        nguyen_nhan: nguyen_nhan || disease.nguyen_nhan,
        trieu_chung: trieu_chung || disease.trieu_chung,
        chan_doan: chan_doan || disease.chan_doan,
        dieu_tri: dieu_tri || disease.dieu_tri
      });
      
      // Lấy thông tin đã cập nhật
      const updatedDisease = await diseaseModel.getById(id);
      
      return res.json({
        status: 'success',
        message: 'Cập nhật bệnh thành công',
        data: updatedDisease
      });
    } catch (error) {
      console.error('Update disease error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi cập nhật bệnh',
        code: 'UPDATE_DISEASE_ERROR'
      });
    }
  },
  
  // Admin: Xóa bệnh
  async deleteDisease(req, res) {
    try {
      const { id } = req.params;
      
      // Kiểm tra bệnh tồn tại
      const disease = await diseaseModel.getById(id);
      
      if (!disease) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy bệnh',
          code: 'DISEASE_NOT_FOUND'
        });
      }
      
      // Xóa bệnh
      await diseaseModel.delete(id);
      
      return res.json({
        status: 'success',
        message: 'Xóa bệnh thành công'
      });
    } catch (error) {
      console.error('Delete disease error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa bệnh',
        code: 'DELETE_DISEASE_ERROR'
      });
    }
  }
};

module.exports = diseaseController; 