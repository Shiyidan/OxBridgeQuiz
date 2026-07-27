-- CreateTable
CREATE TABLE `UserLegalAcceptance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(64) NOT NULL,
    `documentVersion` VARCHAR(32) NOT NULL,
    `source` VARCHAR(32) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserLegalAcceptance_userId_acceptedAt_idx`(`userId`, `acceptedAt`),
    INDEX `UserLegalAcceptance_documentType_documentVersion_idx`(`documentType`, `documentVersion`),
    UNIQUE INDEX `UserLegalAcceptance_userId_documentType_documentVersion_key`(`userId`, `documentType`, `documentVersion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserLegalAcceptance` ADD CONSTRAINT `UserLegalAcceptance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
