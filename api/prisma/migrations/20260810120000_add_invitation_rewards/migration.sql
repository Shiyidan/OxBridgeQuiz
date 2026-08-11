-- AlterTable
ALTER TABLE `UserMembership` ADD COLUMN `paymentOrderId` VARCHAR(191) NULL,
    ADD COLUMN `sourceId` VARCHAR(191) NULL,
    ADD COLUMN `sourceType` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `InvitationCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvitationCode_userId_key`(`userId`),
    UNIQUE INDEX `InvitationCode_code_key`(`code`),
    INDEX `InvitationCode_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvitationRelation` (
    `id` VARCHAR(191) NOT NULL,
    `inviterUserId` VARCHAR(191) NOT NULL,
    `inviteeUserId` VARCHAR(191) NOT NULL,
    `invitationCodeId` VARCHAR(191) NOT NULL,
    `triggerPaymentOrderId` VARCHAR(191) NULL,
    `source` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
    `boundAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rewardedAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvitationRelation_inviteeUserId_key`(`inviteeUserId`),
    UNIQUE INDEX `InvitationRelation_triggerPaymentOrderId_key`(`triggerPaymentOrderId`),
    INDEX `InvitationRelation_inviterUserId_createdAt_idx`(`inviterUserId`, `createdAt`),
    INDEX `InvitationRelation_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `InvitationRelation_invitationCodeId_idx`(`invitationCodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvitationReward` (
    `id` VARCHAR(191) NOT NULL,
    `invitationRelationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `triggerPaymentOrderId` VARCHAR(191) NULL,
    `membershipId` VARCHAR(191) NULL,
    `beneficiaryRole` VARCHAR(16) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
    `examType` VARCHAR(32) NULL,
    `durationHours` INTEGER NOT NULL DEFAULT 168,
    `grantedAt` DATETIME(3) NULL,
    `activatedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvitationReward_membershipId_key`(`membershipId`),
    INDEX `InvitationReward_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    INDEX `InvitationReward_triggerPaymentOrderId_idx`(`triggerPaymentOrderId`),
    UNIQUE INDEX `InvitationReward_invitationRelationId_beneficiaryRole_key`(`invitationRelationId`, `beneficiaryRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `UserMembership_sourceType_sourceId_idx` ON `UserMembership`(`sourceType`, `sourceId`);

-- CreateIndex
CREATE UNIQUE INDEX `UserMembership_paymentOrderId_examType_key` ON `UserMembership`(`paymentOrderId`, `examType`);

-- AddForeignKey
ALTER TABLE `UserMembership` ADD CONSTRAINT `UserMembership_paymentOrderId_fkey` FOREIGN KEY (`paymentOrderId`) REFERENCES `PaymentOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationCode` ADD CONSTRAINT `InvitationCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationRelation` ADD CONSTRAINT `InvitationRelation_inviterUserId_fkey` FOREIGN KEY (`inviterUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationRelation` ADD CONSTRAINT `InvitationRelation_inviteeUserId_fkey` FOREIGN KEY (`inviteeUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationRelation` ADD CONSTRAINT `InvitationRelation_invitationCodeId_fkey` FOREIGN KEY (`invitationCodeId`) REFERENCES `InvitationCode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationRelation` ADD CONSTRAINT `InvitationRelation_triggerPaymentOrderId_fkey` FOREIGN KEY (`triggerPaymentOrderId`) REFERENCES `PaymentOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationReward` ADD CONSTRAINT `InvitationReward_invitationRelationId_fkey` FOREIGN KEY (`invitationRelationId`) REFERENCES `InvitationRelation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationReward` ADD CONSTRAINT `InvitationReward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationReward` ADD CONSTRAINT `InvitationReward_triggerPaymentOrderId_fkey` FOREIGN KEY (`triggerPaymentOrderId`) REFERENCES `PaymentOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvitationReward` ADD CONSTRAINT `InvitationReward_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `UserMembership`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
