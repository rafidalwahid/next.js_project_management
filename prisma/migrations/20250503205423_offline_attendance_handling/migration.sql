-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `autoCheckout` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `attendance_correction_request` (
    `id` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originalCheckInTime` DATETIME(3) NOT NULL,
    `originalCheckOutTime` DATETIME(3) NULL,
    `requestedCheckInTime` DATETIME(3) NOT NULL,
    `requestedCheckOutTime` DATETIME(3) NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_correction_request_attendanceId_idx`(`attendanceId`),
    INDEX `attendance_correction_request_userId_idx`(`userId`),
    INDEX `attendance_correction_request_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance_correction_request` ADD CONSTRAINT `attendance_correction_request_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `attendance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_correction_request` ADD CONSTRAINT `attendance_correction_request_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
