-- CreateTable
CREATE TABLE `BackgroundJobLease` (
    `name` VARCHAR(64) NOT NULL,
    `ownerId` VARCHAR(128) NOT NULL,
    `lockedUntil` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BackgroundJobLease_lockedUntil_idx`(`lockedUntil`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
