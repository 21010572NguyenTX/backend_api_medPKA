const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');

const userController = {
  // Lấy thông tin profile của người dùng đăng nhập
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Loại bỏ các thông tin nhạy cảm
      delete user.password;
      delete user.refresh_token;
      
      return res.json({
        status: 'success',
        message: 'Lấy thông tin người dùng thành công',
        data: user
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy thông tin người dùng',
        code: 'GET_PROFILE_ERROR'
      });
    }
  },
  
  // Cập nhật thông tin profile
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, avatar_url } = req.body;
      
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Cập nhật thông tin
      await userModel.update(userId, {
        username: username || user.username,
        avatar_url: avatar_url || user.avatar_url
      });
      
      // Lấy thông tin đã cập nhật
      const updatedUser = await userModel.findById(userId);
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      
      return res.json({
        status: 'success',
        message: 'Cập nhật thông tin thành công',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi cập nhật thông tin người dùng',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  },
  
  // Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;
      
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Kiểm tra tài khoản OAuth
      if (user.oauth_provider) {
        return res.status(400).json({
          status: 'error',
          message: 'Tài khoản OAuth không thể đổi mật khẩu bằng phương thức này',
          code: 'OAUTH_ACCOUNT'
        });
      }
      
      // Kiểm tra mật khẩu hiện tại
      const isPasswordValid = await bcrypt.compare(current_password, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Mật khẩu hiện tại không đúng',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }
      
      // Mã hóa mật khẩu mới
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      // Cập nhật mật khẩu
      await userModel.update(userId, {
        password: hashedPassword
      });
      
      return res.json({
        status: 'success',
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi đổi mật khẩu',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  },
  
  // Xóa tài khoản (người dùng tự xóa)
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Xóa tài khoản và các dữ liệu liên quan
      await userModel.delete(userId);
      
      return res.json({
        status: 'success',
        message: 'Xóa tài khoản thành công'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa tài khoản',
        code: 'DELETE_ACCOUNT_ERROR'
      });
    }
  },
  
  // Admin: Lấy danh sách người dùng
  async getAllUsers(req, res) {
    try {
      const { limit, offset } = req.query;
      
      const result = await userModel.getAll(limit, offset);
      
      // Loại bỏ thông tin nhạy cảm
      const users = result.data.map(user => {
        delete user.password;
        delete user.refresh_token;
        return user;
      });
      
      return res.json({
        status: 'success',
        message: 'Lấy danh sách người dùng thành công',
        data: users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy danh sách người dùng',
        code: 'GET_USERS_ERROR'
      });
    }
  },
  
  // Admin: Lấy thông tin chi tiết người dùng
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await userModel.findById(id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Loại bỏ thông tin nhạy cảm
      delete user.password;
      delete user.refresh_token;
      
      return res.json({
        status: 'success',
        message: 'Lấy thông tin người dùng thành công',
        data: user
      });
    } catch (error) {
      console.error('Get user by id error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi lấy thông tin người dùng',
        code: 'GET_USER_ERROR'
      });
    }
  },
  
  // Admin: Cập nhật quyền người dùng
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Quyền không hợp lệ',
          code: 'INVALID_ROLE'
        });
      }
      
      const user = await userModel.findById(id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Cập nhật quyền
      await userModel.update(id, { role });
      
      // Lấy thông tin đã cập nhật
      const updatedUser = await userModel.findById(id);
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      
      return res.json({
        status: 'success',
        message: 'Cập nhật quyền thành công',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user role error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi cập nhật quyền người dùng',
        code: 'UPDATE_ROLE_ERROR'
      });
    }
  },
  
  // Admin: Xóa người dùng
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await userModel.findById(id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Kiểm tra không thể tự xóa chính mình
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Không thể tự xóa tài khoản của mình bằng API này',
          code: 'CANNOT_DELETE_SELF'
        });
      }
      
      // Xóa người dùng
      await userModel.delete(id);
      
      return res.json({
        status: 'success',
        message: 'Xóa người dùng thành công'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi xóa người dùng',
        code: 'DELETE_USER_ERROR'
      });
    }
  }
};

module.exports = userController; 