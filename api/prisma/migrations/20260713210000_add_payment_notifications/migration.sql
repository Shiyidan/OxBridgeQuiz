-- CreateTable
CREATE TABLE `PaymentNotification` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'chinaums',
    `notificationId` VARCHAR(128) NOT NULL,
    `orderNo` VARCHAR(64) NULL,
    `signatureValid` BOOLEAN NOT NULL DEFAULT false,
    `processStatus` VARCHAR(32) NOT NULL DEFAULT 'received',
    `rawPayload` JSON NOT NULL,
    `errorMessage` VARCHAR(500) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentNotification_orderNo_createdAt_idx`(`orderNo`, `createdAt`),
    INDEX `PaymentNotification_processStatus_createdAt_idx`(`processStatus`, `createdAt`),
    UNIQUE INDEX `PaymentNotification_provider_notificationId_key`(`provider`, `notificationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
