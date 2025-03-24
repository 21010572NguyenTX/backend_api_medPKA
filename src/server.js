const app = require('./app');
const { pool, testConnection } = require('./config/database');

// Kiểm tra kết nối database trước khi chạy server
async function startServer() {
  try {
    // Kiểm tra kết nối database
    await pool.getConnection();
    console.log('✅ Kết nối với MySQL thành công');

    // Cổng mặc định từ biến môi trường hoặc 3000
    const PORT = process.env.PORT || 3000;
    
    // Khởi động server
    app.listen(PORT, () => {
      console.log(`✅ MedCure API đang chạy trên cổng ${PORT}`);
      console.log(`📝 Môi trường: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Không thể kết nối với cơ sở dữ liệu:', error);
    process.exit(1);
  }
}

// Xử lý lỗi không mong muốn
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Khởi động server
startServer(); 