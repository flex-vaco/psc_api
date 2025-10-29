
ALTER TABLE `employee_project_allocations` 
ADD COLUMN `work_request_id` int(10) unsigned NOT NULL DEFAULT 1 AFTER `project_id`;

ALTER TABLE `employee_project_allocations` 
ADD CONSTRAINT `fk_employee_project_allocations_work_request` 
FOREIGN KEY (`work_request_id`) REFERENCES `work_request`(`work_request_id`) ON DELETE CASCADE;

--- revert changes ---
-- ALTER TABLE `employee_project_allocations` 
-- DROP FOREIGN KEY `fk_employee_project_allocations_work_request`;

-- ALTER TABLE `employee_project_allocations` 
-- DROP COLUMN `work_request_id`;  
