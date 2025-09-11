-- Below statements are added for converting to multi-tenant with Line_Of_Business as the base table for each tenant
ALTER TABLE `line_of_business` CHANGE `id` `line_of_business_id` int(10) unsigned NOT NULL AUTO_INCREMENT;

ALTER TABLE `line_of_business` 
  ADD COLUMN `location` varchar(100) NOT NULL, 
  ADD COLUMN `contact_person` varchar(100) NOT NULL, 
  ADD COLUMN `contact_email`  varchar(100) NOT NULL;

CREATE TABLE `service_line` (
  `service_line_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `capability_area` (
  `capability_area_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `service_line_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`capability_area_id`),
  FOREIGN KEY (`service_line_id`) REFERENCES `service_line`(`service_line_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

ALTER TABLE `service_line` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

ALTER TABLE `service_line` 
ADD CONSTRAINT `fk_service_line_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`line_of_business_id`) ON DELETE CASCADE;

-- UPDATE `service_line` SET `line_of_business_id` = 0 WHERE `line_of_business_id` = 1 OR `line_of_business_id` IS NULL;

ALTER TABLE `service_line` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;


ALTER TABLE `capability_area` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `description`;

ALTER TABLE `capability_area` 
ADD CONSTRAINT `fk_capability_area_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`line_of_business_id`) ON DELETE CASCADE;

-- UPDATE `capability_area` SET `line_of_business_id` = 1 WHERE `line_of_business_id` = 0 OR `line_of_business_id` IS NULL;


ALTER TABLE `capability_area` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;


CREATE TABLE `work_request` (
  `work_request_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `service_line_id` int(10) unsigned NOT NULL,
  `project_id` int(10) unsigned NOT NULL,
  `duration_from` date NOT NULL,
  `duration_to` date NOT NULL,
  `hours_per_week` int(3) NOT NULL,
  `notes` text NULL,
  `project_attachment` varchar(500) NULL,
  `status` enum('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  `submitted_by` int(10) unsigned NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`work_request_id`),
  FOREIGN KEY (`service_line_id`) REFERENCES `service_line`(`service_line_id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `project_details`(`project_id`) ON DELETE CASCADE,
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `work_request_capability_areas` (
  `work_request_capability_area_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `work_request_id` int(10) unsigned NOT NULL,
  `capability_area_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`work_request_capability_area_id`),
  UNIQUE KEY `uk_work_request_capability` (`work_request_id`, `capability_area_id`),
  FOREIGN KEY (`work_request_id`) REFERENCES `work_request`(`work_request_id`) ON DELETE CASCADE,
  FOREIGN KEY (`capability_area_id`) REFERENCES `capability_area`(`capability_area_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `work_request_resources` (
  `work_request_resource_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `work_request_id` int(10) unsigned NOT NULL,
  `employee_id` int(10) unsigned NOT NULL,
  `allocation_percentage` int(3) DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`work_request_resource_id`),
  UNIQUE KEY `uk_work_request_employee` (`work_request_id`, `employee_id`),
  FOREIGN KEY (`work_request_id`) REFERENCES `work_request`(`work_request_id`) ON DELETE CASCADE,
  FOREIGN KEY (`employee_id`) REFERENCES `employee_details`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


ALTER TABLE `user_roles` DROP INDEX `role`;

-- Add Name column after role column
ALTER TABLE `user_roles` ADD COLUMN `name` varchar(100) NOT NULL AFTER `role`;

-- Update existing records to set name based on role (for backward compatibility)
UPDATE `user_roles` SET `name` = `role` WHERE `name` IS NULL OR `name` = '';

ALTER TABLE `user_roles` ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `role_description`;

-- Add foreign key constraint (will fail gracefully if it already exists)
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`line_of_business_id`) ON DELETE CASCADE;


ALTER TABLE `work_request` 
ADD COLUMN `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `service_line_id`;

-- Add foreign key constraint
ALTER TABLE `work_request` 
ADD CONSTRAINT `fk_work_request_line_of_business` 
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business`(`line_of_business_id`) ON DELETE CASCADE;

-- Make the column NOT NULL after setting default values
ALTER TABLE `work_request` 
MODIFY COLUMN `line_of_business_id` int(10) unsigned NOT NULL;

ALTER TABLE `employee_details` DROP `line_of_business_id`;

ALTER TABLE `users` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `role`;
 
ALTER TABLE `project_details` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `client_id`;
 
ALTER TABLE `employee_details` ADD `line_of_business_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `functional_focus_area`;
 
ALTER TABLE `users`
ADD CONSTRAINT `fk_users_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`line_of_business_id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
ALTER TABLE `project_details`
ADD CONSTRAINT `fk_project_details_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`line_of_business_id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
ALTER TABLE `employee_details`
ADD CONSTRAINT `fk_employee_details_line_of_business`
FOREIGN KEY (`line_of_business_id`) REFERENCES `line_of_business` (`line_of_business_id`)
ON DELETE RESTRICT ON UPDATE CASCADE;
 
CREATE INDEX `idx_users_line_of_business_id` ON `users` (`line_of_business_id`);
CREATE INDEX `idx_project_details_line_of_business_id` ON `project_details` (`line_of_business_id`);
CREATE INDEX `idx_employee_details_line_of_business_id` ON `employee_details` (`line_of_business_id`);

CREATE TABLE `offshore_lead_service_lines` (
    `offshore_lead_service_line_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `offshore_lead_id` int(10) unsigned NOT NULL,
    `service_line_id` int(10) unsigned NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`offshore_lead_service_line_id`),
    UNIQUE KEY `uidx_offshore_lead_service_line` (`offshore_lead_id`,`service_line_id`),
    KEY `service_line_offshore_lead_service_lines_fk` (`service_line_id`),
    CONSTRAINT `service_line_offshore_lead_service_lines_fk` FOREIGN KEY (`service_line_id`) REFERENCES `service_line` (`service_line_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `users_offshore_lead_service_lines_fk` FOREIGN KEY (`offshore_lead_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- Create table for work request offshore leads assignment
CREATE TABLE `work_request_offshore_leads` (
    `work_request_offshore_lead_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `work_request_id` int(10) unsigned NOT NULL,
    `offshore_lead_id` int(10) unsigned NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`work_request_offshore_lead_id`),
    UNIQUE KEY `uidx_work_request_offshore_lead` (`work_request_id`,`offshore_lead_id`),
    KEY `work_request_offshore_leads_fk` (`work_request_id`),
    KEY `users_work_request_offshore_leads_fk` (`offshore_lead_id`),
    CONSTRAINT `work_request_offshore_leads_fk` FOREIGN KEY (`work_request_id`) REFERENCES `work_request` (`work_request_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `users_work_request_offshore_leads_fk` FOREIGN KEY (`offshore_lead_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

ALTER TABLE `employee_details` 
ADD COLUMN `service_line_id` int(10) unsigned NULL AFTER `line_of_business_id`;

ALTER TABLE `employee_details` 
ADD CONSTRAINT `fk_employee_details_service_line` 
FOREIGN KEY (`service_line_id`) REFERENCES `service_line`(`service_line_id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `employee_capability_areas` (
  `employee_capability_area_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `emp_id` int(10) unsigned NOT NULL,
  `capability_area_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_capability_area_id`),
  UNIQUE KEY `uk_employee_capability_area` (`emp_id`, `capability_area_id`),
  KEY `idx_employee_capability_areas_emp_id` (`emp_id`),
  KEY `idx_employee_capability_areas_capability_area_id` (`capability_area_id`),
  CONSTRAINT `fk_employee_capability_areas_employee` 
    FOREIGN KEY (`emp_id`) REFERENCES `employee_details`(`emp_id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_employee_capability_areas_capability_area` 
    FOREIGN KEY (`capability_area_id`) REFERENCES `capability_area`(`capability_area_id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

