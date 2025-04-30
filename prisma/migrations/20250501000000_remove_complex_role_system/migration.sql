-- This migration removes the complex role-permission system tables
-- while keeping the simple role field in the User model

-- Drop foreign key constraints first
ALTER TABLE `user_permission` DROP FOREIGN KEY `user_permission_userId_fkey`;
ALTER TABLE `user_permission` DROP FOREIGN KEY `user_permission_permissionId_fkey`;
ALTER TABLE `user_role` DROP FOREIGN KEY `user_role_userId_fkey`;
ALTER TABLE `user_role` DROP FOREIGN KEY `user_role_roleId_fkey`;
ALTER TABLE `role_permission` DROP FOREIGN KEY `role_permission_roleId_fkey`;
ALTER TABLE `role_permission` DROP FOREIGN KEY `role_permission_permissionId_fkey`;

-- Drop tables
DROP TABLE IF EXISTS `user_permission`;
DROP TABLE IF EXISTS `user_role`;
DROP TABLE IF EXISTS `role_permission`;
DROP TABLE IF EXISTS `permission`;
DROP TABLE IF EXISTS `role`;

-- Note: We keep the role field in the User model
-- This is already defined as a string with default value "user"
