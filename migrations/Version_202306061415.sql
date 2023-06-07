/************************************************************
# SQL Migrations
# Version 202306061415
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-06-06 14:15:00 +0530
# ************************************************************/

ALTER TABLE `employee_details`
	CHANGE `supervisor_name` `manager_name` varchar(100),
	CHANGE `supervisor_email` `manager_email` varchar(100);
	
ALTER TABLE `timesheets`
	CHANGE `supervisor_email` `manager_email` varchar(100);
	
UPDATE `user_roles` SET `role`='manager', `role_description` = 'Manager'
	where `role`='supervisor';
	
UPDATE `users` SET `role`='manager'
	where `role`='supervisor';