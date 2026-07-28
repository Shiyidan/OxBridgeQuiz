-- AlterTable
ALTER TABLE `Question` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `importBatchId` VARCHAR(191) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `paperId` VARCHAR(191) NULL,
    MODIFY `number` INTEGER NULL;

-- CreateTable
CREATE TABLE `QuestionImportBatch` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `declaredQuestionCount` INTEGER NOT NULL,
    `actualQuestionCount` INTEGER NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuestionImportBatch_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionKnowledgePoint` (
    `questionId` VARCHAR(191) NOT NULL,
    `syllabusNodeId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(32) NOT NULL,

    INDEX `QuestionKnowledgePoint_syllabusNodeId_questionId_idx`(`syllabusNodeId`, `questionId`),
    PRIMARY KEY (`questionId`, `syllabusNodeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Question_importBatchId_idx` ON `Question`(`importBatchId`);

-- CreateIndex
CREATE INDEX `Question_status_examType_difficulty_idx` ON `Question`(`status`, `examType`, `difficulty`);

-- CreateIndex
CREATE INDEX `Question_status_examType_subjectCode_idx` ON `Question`(`status`, `examType`, `subjectCode`);

-- CreateIndex
CREATE INDEX `Question_status_examType_topicCode_idx` ON `Question`(`status`, `examType`, `topicCode`);

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_importBatchId_fkey` FOREIGN KEY (`importBatchId`) REFERENCES `QuestionImportBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionKnowledgePoint` ADD CONSTRAINT `QuestionKnowledgePoint_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionKnowledgePoint` ADD CONSTRAINT `QuestionKnowledgePoint_syllabusNodeId_fkey` FOREIGN KEY (`syllabusNodeId`) REFERENCES `SyllabusNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
