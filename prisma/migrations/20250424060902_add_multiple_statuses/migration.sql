-- CreateTable
CREATE TABLE `project_status_link` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `statusId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `project_status_link_projectId_idx`(`projectId`),
    INDEX `project_status_link_statusId_idx`(`statusId`),
    UNIQUE INDEX `project_status_link_projectId_statusId_key`(`projectId`, `statusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_status_link` ADD CONSTRAINT `project_status_link_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_status_link` ADD CONSTRAINT `project_status_link_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `project_status`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
