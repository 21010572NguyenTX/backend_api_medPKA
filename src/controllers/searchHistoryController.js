const { pool } = require('../config/database');

const searchHistoryController = {
  // Lấy lịch sử tìm kiếm của người dùng
  async getSearchHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;
      
      // Lấy dữ liệu lịch sử tìm kiếm
      const [searchHistory] = await pool.query(
        `SELECT * FROM search_history 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, Number(limit), Number(offset)]
      );
      
      // Đếm tổng số lịch sử tìm kiếm
      const [totalResult] = await pool.query(
        `SELECT COUNT(*) AS total 
         FROM search_history 
         WHERE user_id = ?`,
        [userId]
      );
      
      const total = totalResult[0].total;
      
      return res.json({
        status: 'success',
        message: 'Lấy lịch sử tìm kiếm thành công',
        data: searchHistory,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          has_more: Number(offset) + searchHistory.length < total
        }
      });
    } catch (error) {
      console.error('Get search history error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy lịch sử tìm kiếm',
        code: 'GET_SEARCH_HISTORY_ERROR'
      });
    }
  },
  
  // Xóa một mục trong lịch sử tìm kiếm
  async deleteSearchHistory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Kiểm tra lịch sử tìm kiếm tồn tại và thuộc về user
      const [searchHistory] = await pool.query(
        'SELECT * FROM search_history WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (searchHistory.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy lịch sử tìm kiếm',
          code: 'SEARCH_HISTORY_NOT_FOUND'
        });
      }
      
      // Xóa lịch sử tìm kiếm
      await pool.query(
        'DELETE FROM search_history WHERE id = ?',
        [id]
      );
      
      return res.json({
        status: 'success',
        message: 'Xóa lịch sử tìm kiếm thành công'
      });
    } catch (error) {
      console.error('Delete search history error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa lịch sử tìm kiếm',
        code: 'DELETE_SEARCH_HISTORY_ERROR'
      });
    }
  },
  
  // Xóa toàn bộ lịch sử tìm kiếm của người dùng
  async clearSearchHistory(req, res) {
    try {
      const userId = req.user.id;
      
      // Xóa toàn bộ lịch sử tìm kiếm
      await pool.query(
        'DELETE FROM search_history WHERE user_id = ?',
        [userId]
      );
      
      return res.json({
        status: 'success',
        message: 'Xóa toàn bộ lịch sử tìm kiếm thành công'
      });
    } catch (error) {
      console.error('Clear search history error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa toàn bộ lịch sử tìm kiếm',
        code: 'CLEAR_SEARCH_HISTORY_ERROR'
      });
    }
  },
  
  // (Không public) Thêm lịch sử tìm kiếm - được gọi từ các controllers khác
  async addSearchHistory(userId, query, type) {
    try {
      await pool.query(
        'INSERT INTO search_history (user_id, search_query, content_type) VALUES (?, ?, ?)',
        [userId, query, type]
      );
      return true;
    } catch (error) {
      console.error('Add search history error:', error);
      return false;
    }
  }
};

module.exports = searchHistoryController; 