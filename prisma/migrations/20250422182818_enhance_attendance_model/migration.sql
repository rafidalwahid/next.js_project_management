-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `adjustedById` VARCHAR(191) NULL,
    ADD COLUMN `adjustmentReason` TEXT NULL,
    ADD COLUMN `manuallyAdjusted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `projectId` VARCHAR(191) NULL,
    ADD COLUMN `taskId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `attendancesettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `workStartTime` VARCHAR(191) NOT NULL DEFAULT '09:00',
    `workEndTime` VARCHAR(191) NOT NULL DEFAULT '17:00',
    `workDaysPerWeek` INTEGER NOT NULL DEFAULT 5,
    `targetHoursPerDay` DOUBLE NOT NULL DEFAULT 8,
    `reminderEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendancesettings_userId_key`(`userId`),
    INDEX `attendancesettings_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendance_projectId_idx` ON `attendance`(`projectId`);

-- CreateIndex
CREATE INDEX `attendance_taskId_idx` ON `attendance`(`taskId`);

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_adjustedById_fkey` FOREIGN KEY (`adjustedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendancesettings` ADD CONSTRAINT `attendancesettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
