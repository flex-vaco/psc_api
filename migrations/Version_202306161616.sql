/************************************************************
# SQL Migrations
# Version 202306161616
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-06-16 16:16:00 +0530
# ************************************************************/
CREATE TABLE `hirings` (
  `hiring_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `emp_id` int(10) unsigned NOT NULL,
  `project_name` varchar(100) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `hours_per_week` float(5,2) unsigned NOT NULL,
  `shift_start_time` time NOT NULL DEFAULT '00:00:00',
  `shift_end_time` time NOT NULL DEFAULT '00:00:00',
  `work_location` varchar(20) DEFAULT NULL,
  `hiring_status` varchar(20) DEFAULT NULL,
  `comments` varchar(250) DEFAULT NULL,
  `created_by` int(11) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int(11) unsigned NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hiring_id`),
  KEY `emp_id` (`emp_id`),
  KEY `hirings_fk_2` (`created_by`),
  KEY `hirings_fk_3` (`updated_by`),
  CONSTRAINT `hirings_fk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee_details` (`emp_id`),
  CONSTRAINT `hirings_fk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `hirings_fk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;