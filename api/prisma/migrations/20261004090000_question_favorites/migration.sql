-- CreateTable
CREATE TABLE `QuestionFavorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QuestionFavorite_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `QuestionFavorite_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `QuestionFavorite_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteCategory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FavoriteCategory_userId_examType_sortOrder_idx`(`userId`, `examType`, `sortOrder`),
    UNIQUE INDEX `FavoriteCategory_userId_examType_name_key`(`userId`, `examType`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuestionFavorite` ADD CONSTRAINT `QuestionFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionFavorite` ADD CONSTRAINT `QuestionFavorite_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionFavorite` ADD CONSTRAINT `QuestionFavorite_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FavoriteCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteCategory` ADD CONSTRAINT `FavoriteCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
