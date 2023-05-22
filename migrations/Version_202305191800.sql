# ************************************************************
# SQL Migrations
# Version 202305191800
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-05-19 18:00:00 +0530
# ************************************************************

ALTER TABLE `users`
	ADD COLUMN `needsPasswordReset` tinyint(1) UNSIGNED DEFAULT NULL;
