/************************************************************
# SQL Migrations
# Version 202305301300
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-05-30 13:00:00 +0530
# ************************************************************/

ALTER TABLE `timesheets`
	ADD COLUMN `overtime` float(5,2) UNSIGNED DEFAULT 0
	AFTER hours_per_day;