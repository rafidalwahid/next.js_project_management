/*
  Warnings:

  - You are about to drop the column `statusId` on the `project` table. All the data in the column will be lost.
  - You are about to drop the `project_status_link` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectId,name]` on the table `project_status` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `project_status` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `project_statusId_fkey`;

-- DropForeignKey
ALTER TABLE `project_status_link` DROP FOREIGN KEY `project_status_link_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `project_status_link` DROP FOREIGN KEY `project_status_link_statusId_fkey`;

-- DropIndex
DROP INDEX `project_statusId_idx` ON `project`;

-- AlterTable
ALTER TABLE `project` DROP COLUMN `statusId`,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `estimatedTime` DOUBLE NULL,
    ADD COLUMN `totalTimeSpent` DOUBLE NULL;

-- AlterTable
ALTER TABLE `project_status` ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `estimatedTime` DOUBLE NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `statusId` VARCHAR(191) NULL,
    ADD COLUMN `timeSpent` DOUBLE NULL;

-- DropTable
DROP TABLE `project_status_link`;

-- CreateIndex
CREATE INDEX `project_status_projectId_idx` ON `project_status`(`projectId`);

-- CreateIndex
CREATE UNIQUE INDEX `project_status_projectId_name_key` ON `project_status`(`projectId`, `name`);

-- CreateIndex
CREATE INDEX `task_statusId_idx` ON `task`(`statusId`);

-- AddForeignKey
ALTER TABLE `project_status` ADD CONSTRAINT `project_status_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `task_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `project_status`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
