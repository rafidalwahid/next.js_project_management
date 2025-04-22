-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `checkInLocationName` TEXT NULL,
    ADD COLUMN `checkOutLocationName` TEXT NULL,
    MODIFY `checkInDeviceInfo` TEXT NULL,
    MODIFY `checkOutDeviceInfo` TEXT NULL;
