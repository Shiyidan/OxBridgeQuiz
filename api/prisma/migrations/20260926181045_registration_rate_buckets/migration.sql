-- CreateTable
CREATE TABLE `RegistrationRateBucket` (
    `key` VARCHAR(96) NOT NULL,
    `events` JSON NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RegistrationRateBucket_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
