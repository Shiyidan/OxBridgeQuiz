-- CreateTable
CREATE TABLE `PaymentReconciliationRun` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'chinaums',
    `businessDate` DATE NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'running',
    `trigger` VARCHAR(32) NOT NULL DEFAULT 'scheduled',
    `triggeredBy` VARCHAR(191) NULL,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `matchedOrders` INTEGER NOT NULL DEFAULT 0,
    `correctedOrders` INTEGER NOT NULL DEFAULT 0,
    `anomalyOrders` INTEGER NOT NULL DEFAULT 0,
    `errorOrders` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` VARCHAR(500) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentReconciliationRun_status_businessDate_idx`(`status`, `businessDate`),
    UNIQUE INDEX `PaymentReconciliationRun_provider_businessDate_key`(`provider`, `businessDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentReconciliationItem` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `paymentOrderId` VARCHAR(191) NOT NULL,
    `orderNo` VARCHAR(64) NOT NULL,
    `localStatus` VARCHAR(32) NOT NULL,
    `providerStatus` VARCHAR(32) NULL,
    `localAmountCents` INTEGER NOT NULL,
    `providerAmountCents` INTEGER NULL,
    `result` VARCHAR(32) NOT NULL,
    `anomalyType` VARCHAR(64) NULL,
    `message` VARCHAR(500) NOT NULL,
    `providerPayload` JSON NULL,
    `resolutionStatus` VARCHAR(32) NOT NULL DEFAULT 'none',
    `resolutionNote` VARCHAR(500) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentReconciliationItem_resolutionStatus_updatedAt_idx`(`resolutionStatus`, `updatedAt`),
    INDEX `PaymentReconciliationItem_result_updatedAt_idx`(`result`, `updatedAt`),
    INDEX `PaymentReconciliationItem_orderNo_idx`(`orderNo`),
    UNIQUE INDEX `PaymentReconciliationItem_runId_paymentOrderId_key`(`runId`, `paymentOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentReconciliationItem` ADD CONSTRAINT `PaymentReconciliationItem_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `PaymentReconciliationRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentReconciliationItem` ADD CONSTRAINT `PaymentReconciliationItem_paymentOrderId_fkey` FOREIGN KEY (`paymentOrderId`) REFERENCES `PaymentOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
