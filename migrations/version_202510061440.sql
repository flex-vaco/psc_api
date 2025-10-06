-- Drop unique constraints on contact_email and contact_phone
ALTER TABLE `project_details` DROP INDEX `contact_email`;
ALTER TABLE `project_details` DROP INDEX `contact_phone`;