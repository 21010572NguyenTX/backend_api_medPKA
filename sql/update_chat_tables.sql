-- Xóa khóa ngoại của bảng chat_history nếu tồn tại
SET @constraint_name := (
  SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'chat_history'
  AND REFERENCED_TABLE_NAME = 'users'
);

SET @query = IF(@constraint_name IS NOT NULL, 
                CONCAT('ALTER TABLE chat_history DROP FOREIGN KEY ', @constraint_name),
                'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tạo bảng conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_pinned BOOLEAN DEFAULT FALSE,
  model_used VARCHAR(50),
  folder_id VARCHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tạo bảng messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sources JSON,
  metadata JSON,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Thủ tục để di chuyển dữ liệu từ chat_history sang conversations và messages
DELIMITER //
CREATE PROCEDURE MigrateChatData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE chat_id INT;
  DECLARE user_id INT;
  DECLARE question TEXT;
  DECLARE answer TEXT;
  DECLARE sources JSON;
  DECLARE created_at TIMESTAMP;
  DECLARE conversation_id VARCHAR(36);
  
  -- Khai báo cursor để đọc từng bản ghi trong chat_history
  DECLARE cur CURSOR FOR 
    SELECT id, user_id, question, answer, sources, created_at
    FROM chat_history;
  
  -- Handler khi hết bản ghi
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Mở cursor
  OPEN cur;
  
  -- Bắt đầu đọc từng bản ghi
  read_loop: LOOP
    FETCH cur INTO chat_id, user_id, question, answer, sources, created_at;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Tạo UUID cho conversation
    SET conversation_id = UUID();
    
    -- Chèn vào bảng conversations
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (conversation_id, user_id, LEFT(question, 100), created_at, created_at);
    
    -- Chèn tin nhắn người dùng
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (UUID(), conversation_id, 'user', question, created_at);
    
    -- Chèn tin nhắn trả lời
    INSERT INTO messages (id, conversation_id, role, content, created_at, sources)
    VALUES (UUID(), conversation_id, 'assistant', answer, created_at, sources);
  END LOOP;
  
  -- Đóng cursor
  CLOSE cur;
END //
DELIMITER ;

-- Gọi thủ tục để di chuyển dữ liệu
CALL MigrateChatData();

-- Xóa thủ tục khi hoàn thành
DROP PROCEDURE IF EXISTS MigrateChatData;

-- Chú ý: Sau khi kiểm tra dữ liệu mới, hãy bỏ comment dòng bên dưới để xóa bảng cũ
-- DROP TABLE IF EXISTS chat_history; 