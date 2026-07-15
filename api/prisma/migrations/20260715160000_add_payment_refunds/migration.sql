-- AlterTable
ALTER TABLE `PaymentOrder` ADD COLUMN `refundedAmountCents` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `PaymentRefund` (
    `id` VARCHAR(191) NOT NULL,
    `refundOrderNo` VARCHAR(64) NOT NULL,
    `paymentOrderId` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'processing',
    `providerRefundNo` VARCHAR(128) NULL,
    `providerPayload` JSON NULL,
    `failureCode` VARCHAR(64) NULL,
    `failureMessage` VARCHAR(500) NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentRefund_refundOrderNo_key`(`refundOrderNo`),
    UNIQUE INDEX `PaymentRefund_providerRefundNo_key`(`providerRefundNo`),
    INDEX `PaymentRefund_paymentOrderId_createdAt_idx`(`paymentOrderId`, `createdAt`),
    INDEX `PaymentRefund_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentRefund` ADD CONSTRAINT `PaymentRefund_paymentOrderId_fkey` FOREIGN KEY (`paymentOrderId`) REFERENCES `PaymentOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
