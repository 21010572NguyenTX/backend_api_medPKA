-- Database schema cho MedCure API
-- Lược đồ cơ sở dữ liệu cho hệ thống tra cứu bệnh và thuốc
-- MySQL 5.7+ hoặc MariaDB 10.2+

-- -----------------------------------------------------
-- Bảng `users` - Lưu trữ thông tin người dùng
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(100) NULL,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `avatar_url` VARCHAR(255) NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `oauth_provider` VARCHAR(20) NULL,
  `oauth_id` VARCHAR(100) NULL,
  `refresh_token` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `verification_tokens` - Lưu trữ token xác minh email
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(100) NOT NULL,
  `type` ENUM('email_verification', 'password_reset') NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_verification_tokens_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_verification_tokens_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `user_sessions` - Lưu trữ phiên hoạt động
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `session_token` VARCHAR(100) NOT NULL,
  `device_info` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_user_sessions_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_sessions_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `diseases` - Lưu trữ thông tin bệnh lý
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `diseases` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `disease_name` VARCHAR(100) NOT NULL,
  `disease_name_vi` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `description_vi` TEXT NOT NULL,
  `symptoms` TEXT NOT NULL,
  `symptoms_vi` TEXT NOT NULL,
  `causes` TEXT NULL,
  `causes_vi` TEXT NULL,
  `risk_factors` TEXT NULL,
  `risk_factors_vi` TEXT NULL,
  `prevention` TEXT NULL,
  `prevention_vi` TEXT NULL,
  `treatment` TEXT NULL,
  `treatment_vi` TEXT NULL,
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FULLTEXT INDEX `disease_search_idx` (`disease_name`, `disease_name_vi`, `symptoms`, `symptoms_vi`, `description`, `description_vi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `medicines` - Lưu trữ thông tin thuốc
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `medicine_name` VARCHAR(100) NOT NULL,
  `medicine_name_vi` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `description_vi` TEXT NOT NULL,
  `dosage` TEXT NULL,
  `dosage_vi` TEXT NULL,
  `usage` TEXT NOT NULL,
  `usage_vi` TEXT NOT NULL,
  `side_effects` TEXT NOT NULL,
  `side_effects_vi` TEXT NOT NULL,
  `composition` TEXT NULL,
  `composition_vi` TEXT NULL,
  `manufacturer` VARCHAR(100) NULL,
  `manufacturer_vi` VARCHAR(100) NULL,
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FULLTEXT INDEX `medicine_search_idx` (`medicine_name`, `medicine_name_vi`, `description`, `description_vi`, `usage`, `usage_vi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `search_history` - Lưu trữ lịch sử tìm kiếm
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `search_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `search_query` VARCHAR(255) NOT NULL,
  `content_type` ENUM('disease', 'medicine', 'chat') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_search_history_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_search_history_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `chat_history` - Lưu trữ lịch sử chat
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sources` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_chat_history_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_chat_history_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `bookmarks` - Lưu trữ bookmark của người dùng
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `content_type` ENUM('disease', 'medicine') NOT NULL,
  `content_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `bookmark_unique_idx` (`user_id` ASC, `content_type` ASC, `content_id` ASC),
  INDEX `fk_bookmarks_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_bookmarks_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Bảng `vector_embeddings` - Lưu trữ vector embeddings
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vector_embeddings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content_type` ENUM('disease', 'medicine') NOT NULL,
  `content_id` INT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `embedding` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `embedding_unique_idx` (`content_type` ASC, `content_id` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tạo tài khoản admin mặc định
-- Mật khẩu: admin123 (đã được hash)
-- -----------------------------------------------------
INSERT INTO `users` (`username`, `email`, `password`, `is_email_verified`, `role`)
VALUES ('Admin', 'admin@medcure.com', '$2b$10$4qoIKlrSR8jKJ9.B8ywl5ewyPa3gKVDwj9cdgmO5ULWi.yVc5T1pu', 1, 'admin'); 