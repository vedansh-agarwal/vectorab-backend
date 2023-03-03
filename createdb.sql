DROP DATABASE IF EXISTS `vectorab`;
CREATE DATABASE `vectorab`;
USE `vectorab`;
CREATE TABLE `students` (
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
   PRIMARY KEY (`email`)
);

CREATE TABLE `otp` (
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(6) NOT NULL
);