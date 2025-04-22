/*
  Warnings:

  - You are about to drop the column `status` on the `task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `task_status_idx` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `status`;
