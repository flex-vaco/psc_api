/************************************************************
# SQL Migrations
# Version 202306071011
#
# Author: Rajender
# Database: fract_db
# Generation Time: 2023-06-07 10:11:00 +0530
# ************************************************************/

SELECT * FROM users;

/* BACK-UP COMMANDS 
ALTER TABLE `users`
	ADD COLUMN `client_id` int(10) UNSIGNED DEFAULT NULL;

UPDATE `users` SET `client_id` = 3 where `user_id`=29;
UPDATE `users` SET `client_id` = 4 where `user_id`=26;
*/

CREATE TABLE `producer_clients` (
    `id`int(10) unsigned NOT NULL AUTO_INCREMENT,
    `producer_id` int(10) unsigned NOT NULL,
    `client_id` int(10) unsigned NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uidx_producer_client` (`producer_id`,`client_id`),
    KEY `clients_producer_clients_fk` (`client_id`),
    CONSTRAINT `clients_producer_clients_fk` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `users_producer_clients_fk` FOREIGN KEY (`producer_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

INSERT INTO `producer_clients` (`producer_id`, `client_id`)
 	SELECT `user_id`, `client_id` 
 		FROM `users`
 		WHERE `client_id` IS NOT NULL
 		AND `role`='producer';

ALTER TABLE `users` 
    DROP FOREIGN KEY `users_client_fk1`, 
	DROP COLUMN `client_id`;