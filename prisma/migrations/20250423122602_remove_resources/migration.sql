/*
  Warnings:

  - You are about to drop the `resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `resource_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `resource` DROP FOREIGN KEY `resource_projectId_fkey`;

-- DropTable
DROP TABLE `resource`;
