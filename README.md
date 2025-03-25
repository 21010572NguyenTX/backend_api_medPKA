# MedCure API Documentation

## Giới thiệu
MedCure API là một RESTful API cung cấp các dịch vụ liên quan đến y tế, bao gồm quản lý thông tin bệnh, thuốc, người dùng và tương tác chat. API hỗ trợ đa ngôn ngữ (Tiếng Việt và Tiếng Anh).

## Cài đặt và Cấu hình

### Yêu cầu hệ thống
- Node.js >= 14.x
- MySQL >= 5.7
- Redis (tùy chọn, cho caching)

### Cài đặt
1. Clone repository:
```bash
git clone [repository-url]
cd medcure-api
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env dựa trên .env.example:
```bash
cp .env.example .env
```

4. Cấu hình các biến môi trường trong file .env:
```env
PORT=3000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=medcure
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

5. Import cơ sở dữ liệu:
```bash
mysql -u your_username -p medcure < sql/sql_without_data.sql
```

6. Khởi động server:
```bash
npm start
```

## API Endpoints

### Authentication

#### Đăng ký tài khoản
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

Response:
```json
{
  "status": "success",
  "message": "Đăng ký thành công",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "role": "user"
    }
  }
}
```

### Diseases (Bệnh)

#### Lấy danh sách bệnh
```http
GET /api/diseases?page=1&limit=10
```

Response:
```json
{
  "status": "success",
  "data": {
    "diseases": [
      {
        "id": 1,
        "disease_name": "Diabetes",
        "disease_name_vi": "Bệnh tiểu đường",
        "description": "A chronic condition...",
        "description_vi": "Một bệnh mãn tính...",
        "symptoms": "Increased thirst...",
        "symptoms_vi": "Tăng khát nước...",
        "image_url": "https://example.com/diabetes.jpg"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### Tìm kiếm bệnh
```http
GET /api/diseases/search?q=diabetes&page=1&limit=10
```

Response: Tương tự như lấy danh sách bệnh

### Medicines (Thuốc)

#### Lấy danh sách thuốc
```http
GET /api/medicines?page=1&limit=10
```

Response:
```json
{
  "status": "success",
  "data": {
    "medicines": [
      {
        "id": 1,
        "medicine_name": "Metformin",
        "medicine_name_vi": "Metformin",
        "description": "An oral diabetes medicine...",
        "description_vi": "Thuốc trị tiểu đường...",
        "dosage": "500mg twice daily",
        "dosage_vi": "500mg hai lần mỗi ngày",
        "usage": "Take with meals...",
        "usage_vi": "Uống trong bữa ăn...",
        "side_effects": "Nausea, vomiting...",
        "side_effects_vi": "Buồn nôn, nôn...",
        "image_url": "https://example.com/metformin.jpg"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Users (Người dùng)

#### Lấy thông tin profile
```http
GET /api/users/profile
Authorization: Bearer <access_token>
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "user",
    "is_email_verified": true
  }
}
```

#### Cập nhật profile
```http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "new_username",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### Bookmarks (Dấu trang)

#### Lấy danh sách bookmark
```http
GET /api/users/bookmarks?page=1&limit=10
Authorization: Bearer <access_token>
```

Response:
```json
{
  "status": "success",
  "data": {
    "bookmarks": [
      {
        "id": 1,
        "content_type": "disease",
        "content_id": 1,
        "content": {
          "disease_name": "Diabetes",
          "disease_name_vi": "Bệnh tiểu đường"
        },
        "created_at": "2024-03-24T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### Chat

#### Gửi tin nhắn chat
```http
POST /api/chat
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Các triệu chứng của bệnh tiểu đường là gì?"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "answer": "Các triệu chứng chính của bệnh tiểu đường bao gồm...",
    "sources": [
      {
        "type": "disease",
        "id": 1,
        "title": "Diabetes",
        "title_vi": "Bệnh tiểu đường"
      }
    ]
  }
}
```

## Xác thực và Phân quyền

API sử dụng JWT (JSON Web Token) cho xác thực. Các request cần xác thực phải bao gồm header:
```
Authorization: Bearer <access_token>
```

### Các role người dùng
- `user`: Người dùng thông thường
- `admin`: Quản trị viên với quyền truy cập cao hơn

## Xử lý Lỗi

API trả về các mã lỗi HTTP chuẩn:
- 200: Thành công
- 400: Lỗi yêu cầu
- 401: Chưa xác thực
- 403: Không có quyền
- 404: Không tìm thấy
- 500: Lỗi server

Format lỗi:
```json
{
  "status": "error",
  "message": "Mô tả lỗi",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

API có giới hạn số lượng request:
- 100 requests/phút cho các endpoint công khai
- 1000 requests/phút cho các endpoint yêu cầu xác thực

## Caching

Một số endpoint được cache để tối ưu hiệu suất:
- Danh sách bệnh/thuốc: 5 phút
- Chi tiết bệnh/thuốc: 1 giờ

## Hỗ trợ

Nếu bạn cần hỗ trợ hoặc có câu hỏi, vui lòng liên hệ:
- Email: support@medcure.com
- Issue Tracker: [GitHub Issues](https://github.com/your-repo/issues) 