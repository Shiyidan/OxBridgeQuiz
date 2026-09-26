-- CreateTable
CREATE TABLE `ProductUsageTrendOverride` (
    `businessDate` DATE NOT NULL,
    `questionBankPracticeCount` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`businessDate`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
