-- AlterTable
ALTER TABLE `examrecord` ADD COLUMN `practiceNotebookId` VARCHAR(191) NULL,
    ADD COLUMN `practiceSnapshot` JSON NULL,
    ADD COLUMN `practiceSource` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `PracticeNotebook` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `knowledgePointCodes` JSON NOT NULL,
    `knowledgePointSnapshot` JSON NOT NULL,
    `questionCount` INTEGER NOT NULL,
    `difficultyMode` VARCHAR(32) NOT NULL,
    `durationMinutes` INTEGER NULL,
    `unseenFirst` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PracticeNotebook_userId_examType_status_updatedAt_idx`(`userId`, `examType`, `status`, `updatedAt`),
    INDEX `PracticeNotebook_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ExamRecord_practiceNotebookId_status_submittedAt_idx` ON `ExamRecord`(`practiceNotebookId`, `status`, `submittedAt`);

-- AddForeignKey
ALTER TABLE `ExamRecord` ADD CONSTRAINT `ExamRecord_practiceNotebookId_fkey` FOREIGN KEY (`practiceNotebookId`) REFERENCES `PracticeNotebook`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeNotebook` ADD CONSTRAINT `PracticeNotebook_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
