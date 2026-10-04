-- AlterTable
ALTER TABLE `User` ADD COLUMN `learningTrackedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `LearningActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `resourceKey` VARCHAR(64) NOT NULL,
    `hourStart` DATETIME(3) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningActivity_userId_occurredAt_idx`(`userId`, `occurredAt`),
    UNIQUE INDEX `LearningActivity_userId_resourceKey_hourStart_key`(`userId`, `resourceKey`, `hourStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LearningActivity` ADD CONSTRAINT `LearningActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
