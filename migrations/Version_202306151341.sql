/************************************************************
# SQL Migrations
# Version 202306141341
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-06-15 13:41:00 +0530
# ************************************************************/
ALTER TABLE `timesheets` 
    ADD UNIQUE `unique_index`(`emp_id`, `project_id`, `timesheet_date`);
