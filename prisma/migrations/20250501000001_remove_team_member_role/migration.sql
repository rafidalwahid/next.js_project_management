-- Remove role field from team_member table
-- This migration simplifies the role system by removing project-specific roles
-- All permission checks will now be based solely on the user's system role

-- First drop indexes that reference the role field (if they exist)
DROP INDEX IF EXISTS `team_member_role_idx` ON `team_member`;
DROP INDEX IF EXISTS `team_member_projectId_role_idx` ON `team_member`;
DROP INDEX IF EXISTS `team_member_userId_role_idx` ON `team_member`;

-- Then drop the role column
ALTER TABLE `team_member` DROP COLUMN IF EXISTS `role`;
