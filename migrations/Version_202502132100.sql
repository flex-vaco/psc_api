ALTER TABLE `hirings` ADD `is_manager_notified` TINYINT(1) NOT NULL DEFAULT '0' AFTER `comments`, ADD `manager_id` INT NOT NULL AFTER `is_manager_notified`;
ALTER TABLE `employee_details` ADD `manager_id` INT NOT NULL DEFAULT '0' AFTER `office_location_city`;

UPDATE employee_details e JOIN users u ON e.manager_email = u.email SET e.manager_id = u.user_id;

DROP TABLE IF EXISTS `hiring_comments`;
CREATE TABLE IF NOT EXISTS `hiring_comments` (
  `hiring_comment_id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `hiring_id` int UNSIGNED NOT NULL,
  `comment` longtext NOT NULL,
  `commented_by` int UNSIGNED NOT NULL,
  `commented_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`hiring_comment_id`),
  KEY `hiring_id` (`hiring_id`),
  KEY `commented_by` (`commented_by`),
  CONSTRAINT `hiring_comments_fk_1` FOREIGN KEY (`hiring_id`) REFERENCES `hirings` (`hiring_id`),
  CONSTRAINT `thiring_comments_fk_2` FOREIGN KEY (`commented_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `office_locations`;
CREATE TABLE IF NOT EXISTS `office_locations` (
  `office_location_id` int NOT NULL AUTO_INCREMENT,
  `office_location_city` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`office_location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;