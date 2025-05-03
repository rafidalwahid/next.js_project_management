/*
  Warnings:

  - You are about to drop the column `adjustedById` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `adjustmentReason` on the `attendance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_adjustedById_fkey`;

-- DropIndex
DROP INDEX `attendance_adjustedById_idx` ON `attendance`;

-- AlterTable
ALTER TABLE `attendance` DROP COLUMN `adjustedById`,
    DROP COLUMN `adjustmentReason`;
