-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `checkInTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkOutTime` DATETIME(3) NULL,
    `checkInLatitude` DOUBLE NULL,
    `checkInLongitude` DOUBLE NULL,
    `checkOutLatitude` DOUBLE NULL,
    `checkOutLongitude` DOUBLE NULL,
    `checkInIpAddress` VARCHAR(191) NULL,
    `checkOutIpAddress` VARCHAR(191) NULL,
    `checkInDeviceInfo` VARCHAR(191) NULL,
    `checkOutDeviceInfo` VARCHAR(191) NULL,
    `totalHours` DOUBLE NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_userId_idx`(`userId`),
    INDEX `attendance_checkInTime_idx`(`checkInTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
