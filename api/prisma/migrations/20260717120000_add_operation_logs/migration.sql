-- CreateTable
CREATE TABLE `OperationLog` (
    `id` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actorUserId` VARCHAR(191) NULL,
    `actorNameSnapshot` VARCHAR(191) NOT NULL,
    `actorEmailSnapshot` VARCHAR(191) NOT NULL,
    `actorRoleSnapshot` VARCHAR(32) NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `action` VARCHAR(128) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `result` VARCHAR(32) NOT NULL,
    `resourceType` VARCHAR(64) NULL,
    `resourceId` VARCHAR(191) NULL,
    `changes` JSON NULL,
    `method` VARCHAR(16) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `errorCode` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OperationLog_occurredAt_idx`(`occurredAt`),
    INDEX `OperationLog_actorRoleSnapshot_occurredAt_idx`(`actorRoleSnapshot`, `occurredAt`),
    INDEX `OperationLog_actorUserId_occurredAt_idx`(`actorUserId`, `occurredAt`),
    INDEX `OperationLog_module_occurredAt_idx`(`module`, `occurredAt`),
    INDEX `OperationLog_action_occurredAt_idx`(`action`, `occurredAt`),
    INDEX `OperationLog_resourceType_resourceId_occurredAt_idx`(`resourceType`, `resourceId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OperationLog` ADD CONSTRAINT `OperationLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
