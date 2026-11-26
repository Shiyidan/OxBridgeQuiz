-- CreateTable
CREATE TABLE `LearningCompletion` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningCompletion_userId_examType_idx`(`userId`, `examType`),
    UNIQUE INDEX `LearningCompletion_userId_examType_code_key`(`userId`, `examType`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LearningCompletion` ADD CONSTRAINT `LearningCompletion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
