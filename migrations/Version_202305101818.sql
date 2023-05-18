# ************************************************************
# SQL Migrations
# Version 202305101818
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-05-10 18:18:36 +0530
# ************************************************************

DROP TABLE IF EXISTS `statuses`;

CREATE TABLE `statuses` (
  `status_id` int(5) unsigned NOT NULL AUTO_INCREMENT,
  `status_name` varchar(20) NOT NULL,
  `context` varchar(20) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `status_name` (`status_name`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;

INSERT INTO `statuses` (`status_id`, `status_name`, `context`, `description`)
VALUES
	(1,'ENTERED','TIMESHEET','Status when Employee enters timesheet'),
	(2,'SUBMITTED','TIMESHEET','Status after employee submitted timesheet'),
	(3,'APPROVED','TIMESHEET','Timesheet approved by supervisor'),
	(4,'REWORK','TIMESHEET','Supervisor advised employee to re-do timesheet'),
	(5,'ACCEPTED','TIMESHEET','Timesheet accepted by Supervisor'),
	(6,'REJECTED','TIMESHEET','Timesheet Rejected by Supervisor/Producer'),
	(7,'CANCELLED','TIMESHEET','Timesheet cancelled');

/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `timesheets`;

CREATE TABLE `timesheets` (
  `timesheet_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `emp_id` int(10) unsigned NOT NULL,
  `project_id` int(10) unsigned NOT NULL,
  `supervisor_id` int(10) unsigned NOT NULL,
  `timesheet_date` date NOT NULL,
  `hours_per_day` float(5,2) unsigned NOT NULL,
  `timesheet_status` varchar(20) NOT NULL,
  `task` varchar(20) NOT NULL,
  `comments` JSON DEFAULT NULL,
  `created_by` int(11) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int(11) unsigned NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`timesheet_id`),
  KEY `emp_id` (`emp_id`),
  KEY `project_id` (`project_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `timesheet_status` (`timesheet_status`),
  CONSTRAINT `timesheets_fk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee_details` (`emp_id`),
  CONSTRAINT `timesheets_fk_2` FOREIGN KEY (`project_id`) REFERENCES `project_details` (`project_id`),
  CONSTRAINT `timesheets_fk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `employee_details` (`emp_id`),
  CONSTRAINT `timesheets_fk_4` FOREIGN KEY (`timesheet_status`) REFERENCES `statuses` (`status_name`),
  CONSTRAINT `timesheets_fk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `timesheets_fk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

ALTER TABLE `users`
	ADD COLUMN `client_id` int(10) UNSIGNED DEFAULT NULL,
	ADD COLUMN `emp_id` int(10) UNSIGNED DEFAULT NULL,
  ADD COLUMN `project_id` int(10) UNSIGNED DEFAULT NULL,
	ADD CONSTRAINT users_client_fk1 FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`),
	ADD CONSTRAINT users_emp_fk1 FOREIGN KEY (`emp_id`) REFERENCES `employee_details` (`emp_id`),
	ADD CONSTRAINT users_project_fk1 FOREIGN KEY (`project_id`) REFERENCES `project_details`(`project_id`);

INSERT INTO `user_roles` (`role`, `role_description`)
VALUES
	('employee', 'Employee');

-- #REVERT STATEMENTS
-- #DROP TABLE IF EXISTS `timesheets`;
-- #DROP TABLE IF EXISTS `statuses`;
-- #ALTER TABLE `employee_details`
-- #	DROP COLUMN is_supervisor,
-- #	DROP COLUMN supervisor_id;
-- ALTER TABLE `users`
-- 	DROP COLUMN `client_id`,
-- 	DROP COLUMN `project_id`;

