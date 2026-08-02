-- CreateTable
CREATE TABLE `WrongQuestionSummary` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `wrongCount` INTEGER NOT NULL DEFAULT 1,
    `firstWrongAt` DATETIME(3) NOT NULL,
    `latestWrongAt` DATETIME(3) NOT NULL,
    `latestAnswerRecordId` VARCHAR(191) NOT NULL,
    `latestExamRecordId` VARCHAR(191) NOT NULL,
    `latestSelectedAnswer` VARCHAR(64) NULL,
    `latestDurationSeconds` INTEGER NOT NULL DEFAULT 0,
    `latestAnsweredAt` DATETIME(3) NULL,
    `latestPaperType` VARCHAR(32) NOT NULL,
    `latestPaperTitle` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WrongQuestionSummary_userId_examType_latestWrongAt_id_idx`(`userId`, `examType`, `latestWrongAt`, `id`),
    INDEX `WrongQuestionSummary_questionId_idx`(`questionId`),
    UNIQUE INDEX `WrongQuestionSummary_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WrongQuestionAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `summaryId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `answerRecordId` VARCHAR(191) NOT NULL,
    `examRecordId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `paperType` VARCHAR(32) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL,
    `selectedAnswer` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WrongQuestionAttempt_answerRecordId_key`(`answerRecordId`),
    INDEX `WrongQuestionAttempt_summaryId_paperType_submittedAt_idx`(`summaryId`, `paperType`, `submittedAt`),
    INDEX `WrongQuestionAttempt_userId_submittedAt_idx`(`userId`, `submittedAt`),
    INDEX `WrongQuestionAttempt_examRecordId_idx`(`examRecordId`),
    INDEX `WrongQuestionAttempt_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WrongQuestionSummary` ADD CONSTRAINT `WrongQuestionSummary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongQuestionSummary` ADD CONSTRAINT `WrongQuestionSummary_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongQuestionAttempt` ADD CONSTRAINT `WrongQuestionAttempt_summaryId_fkey` FOREIGN KEY (`summaryId`) REFERENCES `WrongQuestionSummary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
