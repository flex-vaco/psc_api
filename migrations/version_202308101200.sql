
/************************************************************
# SQL Migrations
# Version 202308101200.
#
# Author: Jenil
# Database: fract_db
# Generation Time: 2023-08-10 12:00:00 +0530
# ************************************************************/
CREATE TABLE `user_queries` (
  `user_query_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `query_description` varchar(100) NOT NULL,
  `query` text NOT NULL,
  `question` text,
  PRIMARY KEY (`user_query_id`),
  KEY `user_queries_FK` (`user_id`),
  CONSTRAINT `user_queries_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;