-- AlterTable
ALTER TABLE `User` ADD COLUMN `accountStatus` VARCHAR(32) NOT NULL DEFAULT 'active',
    ADD COLUMN `banReason` VARCHAR(500) NULL,
    ADD COLUMN `bannedAt` DATETIME(3) NULL;
