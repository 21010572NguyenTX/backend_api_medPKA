const { pool } = require('../config/database');

const bookmarkController = {
  // Lấy danh sách bookmark của người dùng
  async getBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0, type } = req.query;
      
      let query = `
        SELECT b.*, 
               CASE 
                 WHEN b.content_type = 'disease' THEN d.disease_name
                 WHEN b.content_type = 'medicine' THEN m.medicine_name
               END AS content_name,
               CASE 
                 WHEN b.content_type = 'disease' THEN d.image_url
                 WHEN b.content_type = 'medicine' THEN m.image_url
               END AS content_image
        FROM bookmarks b
        LEFT JOIN diseases d ON b.content_type = 'disease' AND b.content_id = d.id
        LEFT JOIN medicines m ON b.content_type = 'medicine' AND b.content_id = m.id
        WHERE b.user_id = ?
      `;
      
      const params = [userId];
      
      // Lọc theo loại nếu có
      if (type && ['disease', 'medicine'].includes(type)) {
        query += ` AND b.content_type = ?`;
        params.push(type);
      }
      
      // Thêm sắp xếp và phân trang
      query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset));
      
      // Lấy dữ liệu bookmark
      const [bookmarks] = await pool.query(query, params);
      
      // Đếm tổng số bookmark
      let countQuery = `
        SELECT COUNT(*) AS total
        FROM bookmarks
        WHERE user_id = ?
      `;
      
      const countParams = [userId];
      
      if (type && ['disease', 'medicine'].includes(type)) {
        countQuery += ` AND content_type = ?`;
        countParams.push(type);
      }
      
      const [totalResult] = await pool.query(countQuery, countParams);
      const total = totalResult[0].total;
      
      return res.json({
        status: 'success',
        message: 'Lấy danh sách bookmark thành công',
        data: bookmarks,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          has_more: offset + bookmarks.length < total
        }
      });
    } catch (error) {
      console.error('Get bookmarks error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy danh sách bookmark',
        code: 'GET_BOOKMARKS_ERROR'
      });
    }
  },
  
  // Thêm bookmark mới
  async addBookmark(req, res) {
    try {
      const userId = req.user.id;
      const { content_type, content_id } = req.body;
      
      // Kiểm tra dữ liệu đầu vào
      if (!content_type || !['disease', 'medicine'].includes(content_type)) {
        return res.status(400).json({
          status: 'error',
          message: 'Loại bookmark không hợp lệ',
          code: 'INVALID_CONTENT_TYPE'
        });
      }
      
      if (!content_id) {
        return res.status(400).json({
          status: 'error',
          message: 'ID nội dung là bắt buộc',
          code: 'CONTENT_ID_REQUIRED'
        });
      }
      
      // Kiểm tra nội dung tồn tại
      let contentExists = false;
      
      if (content_type === 'disease') {
        const [disease] = await pool.query(
          'SELECT id FROM diseases WHERE id = ?',
          [content_id]
        );
        contentExists = disease.length > 0;
      } else if (content_type === 'medicine') {
        const [medicine] = await pool.query(
          'SELECT id FROM medicines WHERE id = ?',
          [content_id]
        );
        contentExists = medicine.length > 0;
      }
      
      if (!contentExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy nội dung',
          code: 'CONTENT_NOT_FOUND'
        });
      }
      
      // Kiểm tra bookmark đã tồn tại
      const [existingBookmark] = await pool.query(
        'SELECT id FROM bookmarks WHERE user_id = ? AND content_type = ? AND content_id = ?',
        [userId, content_type, content_id]
      );
      
      if (existingBookmark.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Bookmark đã tồn tại',
          code: 'BOOKMARK_EXISTS'
        });
      }
      
      // Thêm bookmark mới
      const [result] = await pool.query(
        'INSERT INTO bookmarks (user_id, content_type, content_id) VALUES (?, ?, ?)',
        [userId, content_type, content_id]
      );
      
      // Lấy thông tin bookmark vừa thêm
      const [bookmark] = await pool.query(
        `SELECT b.*, 
                CASE 
                  WHEN b.content_type = 'disease' THEN d.disease_name
                  WHEN b.content_type = 'medicine' THEN m.medicine_name
                END AS content_name,
                CASE 
                  WHEN b.content_type = 'disease' THEN d.image_url
                  WHEN b.content_type = 'medicine' THEN m.image_url
                END AS content_image
         FROM bookmarks b
         LEFT JOIN diseases d ON b.content_type = 'disease' AND b.content_id = d.id
         LEFT JOIN medicines m ON b.content_type = 'medicine' AND b.content_id = m.id
         WHERE b.id = ?`,
        [result.insertId]
      );
      
      return res.status(201).json({
        status: 'success',
        message: 'Thêm bookmark thành công',
        data: bookmark[0]
      });
    } catch (error) {
      console.error('Add bookmark error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi thêm bookmark',
        code: 'ADD_BOOKMARK_ERROR'
      });
    }
  },
  
  // Xóa bookmark
  async removeBookmark(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Kiểm tra bookmark tồn tại và thuộc về user
      const [bookmark] = await pool.query(
        'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (bookmark.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy bookmark',
          code: 'BOOKMARK_NOT_FOUND'
        });
      }
      
      // Xóa bookmark
      await pool.query(
        'DELETE FROM bookmarks WHERE id = ?',
        [id]
      );
      
      return res.json({
        status: 'success',
        message: 'Xóa bookmark thành công'
      });
    } catch (error) {
      console.error('Remove bookmark error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa bookmark',
        code: 'REMOVE_BOOKMARK_ERROR'
      });
    }
  }
};

module.exports = bookmarkController; 