/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `task_assignedToId_fkey`;

-- DropIndex
DROP INDEX `task_assignedToId_idx` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `assignedToId`;
