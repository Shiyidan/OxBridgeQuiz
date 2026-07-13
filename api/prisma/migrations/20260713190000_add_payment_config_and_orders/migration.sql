-- CreateTable
CREATE TABLE `PaymentConfig` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'default',
    `firstMonthlyPriceCents` INTEGER NOT NULL DEFAULT 7800,
    `monthlyPriceCents` INTEGER NOT NULL DEFAULT 7900,
    `yearlyPriceCents` INTEGER NOT NULL DEFAULT 39800,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderNo` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examTypes` JSON NOT NULL,
    `plan` VARCHAR(32) NOT NULL,
    `priceType` VARCHAR(32) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(8) NOT NULL DEFAULT 'CNY',
    `channel` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `provider` VARCHAR(32) NOT NULL DEFAULT 'chinaums',
    `providerOrderNo` VARCHAR(128) NULL,
    `providerPayload` JSON NULL,
    `failureCode` VARCHAR(64) NULL,
    `failureMessage` VARCHAR(500) NULL,
    `paidAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentOrder_orderNo_key`(`orderNo`),
    UNIQUE INDEX `PaymentOrder_providerOrderNo_key`(`providerOrderNo`),
    INDEX `PaymentOrder_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `PaymentOrder_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `PaymentOrder_expiresAt_status_idx`(`expiresAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentOrder` ADD CONSTRAINT `PaymentOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
