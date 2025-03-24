# MedCure API

API Back-end cho ứng dụng tra cứu thuốc và bệnh lý MedCure.

## Tính năng

- Xác thực người dùng (đăng ký, đăng nhập, xác minh email)
- Quản lý người dùng (người dùng và quản trị viên)
- CRUD Bệnh lý và Thuốc
- Tìm kiếm theo triệu chứng
- Hỗ trợ song ngữ Anh-Việt
- Chatbot AI trợ giúp tra cứu
- Đánh dấu yêu thích (bookmark)
- Lịch sử tìm kiếm
- OAuth đăng nhập (Google)

## Yêu cầu

- Node.js v14+
- MySQL 5.7+ / MariaDB 10.2+

## Cài đặt

### Sao chép dự án

```bash
git clone <repository-url>
cd medcure-api
```

### Cài đặt phụ thuộc

```bash
npm install
```

### Cấu hình môi trường

Sao chép tệp `.env.example` thành `.env` và cấu hình các biến môi trường:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin cấu hình của bạn.

### Khởi tạo cơ sở dữ liệu

1. Tạo cơ sở dữ liệu MySQL:

```sql
CREATE DATABASE medcure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Khởi tạo bảng:

```bash
mysql -u yourusername -p medcure < ./sql/schema.sql
```

3. (Tùy chọn) Thêm dữ liệu mẫu:

```bash
mysql -u yourusername -p medcure < ./sql/seed.sql
```

## Chạy ứng dụng

### Môi trường phát triển

```bash
npm run dev
```

### Môi trường sản xuất

```bash
npm start
```

## API Endpoints

### Xác thực người dùng

- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập người dùng
- `POST /api/auth/refresh-token` - Làm mới token
- `GET /api/auth/verify-email/:token` - Xác minh email
- `POST /api/auth/send-verification-email` - Gửi lại email xác minh
- `POST /api/auth/forgot-password` - Khôi phục mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `POST /api/auth/google` - Đăng nhập với Google

### Người dùng

- `GET /api/users/profile` - Lấy thông tin người dùng
- `PUT /api/users/profile` - Cập nhật thông tin người dùng
- `PUT /api/users/change-password` - Đổi mật khẩu
- `DELETE /api/users/account` - Xóa tài khoản

### Bệnh lý

- `GET /api/diseases` - Lấy danh sách bệnh lý
- `GET /api/diseases/:id` - Lấy thông tin chi tiết bệnh lý
- `GET /api/diseases/search` - Tìm kiếm bệnh lý
- `POST /api/diseases/symptoms` - Tìm bệnh lý theo triệu chứng
- `POST /api/diseases` - Thêm bệnh lý mới (Admin)
- `PUT /api/diseases/:id` - Cập nhật bệnh lý (Admin)
- `DELETE /api/diseases/:id` - Xóa bệnh lý (Admin)

### Thuốc

- `GET /api/medicines` - Lấy danh sách thuốc
- `GET /api/medicines/:id` - Lấy thông tin chi tiết thuốc
- `GET /api/medicines/search` - Tìm kiếm thuốc
- `GET /api/medicines/manufacturer` - Lọc thuốc theo nhà sản xuất
- `POST /api/medicines` - Thêm thuốc mới (Admin)
- `PUT /api/medicines/:id` - Cập nhật thuốc (Admin)
- `DELETE /api/medicines/:id` - Xóa thuốc (Admin)

### Chat

- `POST /api/chat` - Gửi câu hỏi đến chatbot
- `GET /api/chat/history` - Lấy lịch sử chat
- `DELETE /api/chat/history/:id` - Xóa 1 mục chat
- `DELETE /api/chat/history` - Xóa toàn bộ lịch sử chat

### Lịch sử tìm kiếm

- `GET /api/users/search-history` - Lấy lịch sử tìm kiếm
- `DELETE /api/users/search-history/:id` - Xóa 1 mục tìm kiếm
- `DELETE /api/users/search-history` - Xóa toàn bộ lịch sử tìm kiếm

### Bookmark (Đánh dấu)

- `GET /api/users/bookmarks` - Lấy danh sách bookmark
- `POST /api/users/bookmarks` - Thêm bookmark mới
- `DELETE /api/users/bookmarks/:id` - Xóa bookmark

### Quản trị viên

- `GET /api/users/all` - Lấy danh sách người dùng (Admin)
- `GET /api/users/:id` - Lấy thông tin người dùng (Admin)
- `PUT /api/users/:id/role` - Cập nhật quyền người dùng (Admin)
- `DELETE /api/users/:id` - Xóa người dùng (Admin)

## License

MIT 