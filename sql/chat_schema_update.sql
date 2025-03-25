-- Xóa các ràng buộc ngoại khóa hiện có
ALTER TABLE `chat_history`
  DROP FOREIGN KEY `fk_chat_history_user_id`;

-- Tạo bảng mới conversations
CREATE TABLE `conversations` (
  `id` varchar(64) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `model_used` varchar(50) DEFAULT NULL,
  `folder_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_conversations_user_id_idx` (`user_id`),
  KEY `conversations_created_at_idx` (`created_at`),
  CONSTRAINT `fk_conversations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng mới messages
CREATE TABLE `messages` (
  `id` varchar(64) NOT NULL,
  `conversation_id` varchar(64) NOT NULL,
  `role` enum('user', 'assistant', 'system') NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sources` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sources`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  KEY `fk_messages_conversation_id_idx` (`conversation_id`),
  KEY `messages_created_at_idx` (`created_at`),
  CONSTRAINT `fk_messages_conversation_id` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Di chuyển dữ liệu từ chat_history sang cấu trúc mới
-- Chạy thủ tục này để di chuyển dữ liệu
DELIMITER //
CREATE PROCEDURE MigrateChatData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE chat_id INT;
  DECLARE chat_user_id INT;
  DECLARE chat_question TEXT;
  DECLARE chat_answer TEXT;
  DECLARE chat_sources TEXT;
  DECLARE chat_created_at TIMESTAMP;
  DECLARE conv_id VARCHAR(64);
  DECLARE msg_user_id VARCHAR(64);
  DECLARE msg_assistant_id VARCHAR(64);
  
  -- Cursor để đọc từng bản ghi trong chat_history
  DECLARE chat_cursor CURSOR FOR 
    SELECT id, user_id, question, answer, sources, created_at 
    FROM chat_history;
  
  -- Khai báo xử lý khi không còn dữ liệu để đọc
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Mở cursor
  OPEN chat_cursor;
  
  -- Bắt đầu đọc dữ liệu
  read_loop: LOOP
    FETCH chat_cursor INTO chat_id, chat_user_id, chat_question, chat_answer, chat_sources, chat_created_at;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Tạo ID cho conversation và messages
    SET conv_id = CONCAT('mig_conv_', chat_id);
    SET msg_user_id = CONCAT('mig_msg_u_', chat_id);
    SET msg_assistant_id = CONCAT('mig_msg_a_', chat_id);
    
    -- Tạo conversation mới
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (conv_id, chat_user_id, LEFT(chat_question, 100), chat_created_at, chat_created_at);
    
    -- Thêm message cho người dùng
    INSERT INTO messages (id, conversation_id, role, content, created_at)
    VALUES (msg_user_id, conv_id, 'user', chat_question, chat_created_at);
    
    -- Thêm message cho trợ lý
    INSERT INTO messages (id, conversation_id, role, content, sources, created_at)
    VALUES (
      msg_assistant_id, 
      conv_id, 
      'assistant', 
      chat_answer, 
      chat_sources,
      chat_created_at
    );
  END LOOP;
  
  -- Đóng cursor
  CLOSE chat_cursor;
END //
DELIMITER ;

-- Chạy thủ tục để di chuyển dữ liệu
CALL MigrateChatData();

-- Xóa thủ tục di chuyển dữ liệu
DROP PROCEDURE IF EXISTS MigrateChatData;

-- Bỏ bảng chat_history (chỉ thực hiện sau khi đã di chuyển dữ liệu thành công)
-- DROP TABLE `chat_history`; 