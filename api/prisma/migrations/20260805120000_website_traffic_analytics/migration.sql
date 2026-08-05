-- CreateTable
CREATE TABLE `WebsiteVisitDaily` (
    `id` VARCHAR(191) NOT NULL,
    `businessDate` DATE NOT NULL,
    `ipHash` CHAR(64) NOT NULL,
    `visitCount` INTEGER NOT NULL DEFAULT 1,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebsiteVisitDaily_businessDate_idx`(`businessDate`),
    UNIQUE INDEX `WebsiteVisitDaily_businessDate_ipHash_key`(`businessDate`, `ipHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
