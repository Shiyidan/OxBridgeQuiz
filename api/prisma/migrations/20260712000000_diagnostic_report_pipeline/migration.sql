-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `submissionKey` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DiagnosticReportTask` (
    `id` VARCHAR(191) NOT NULL,
    `examRecordId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `reportKind` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `stage` VARCHAR(32) NOT NULL DEFAULT 'answers_saved',
    `progress` INTEGER NOT NULL DEFAULT 10,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `errorCode` VARCHAR(64) NULL,
    `errorMessage` TEXT NULL,
    `lockedAt` DATETIME(3) NULL,
    `heartbeatAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `result` JSON NULL,
    `generationMode` VARCHAR(32) NULL,
    `reportVersion` VARCHAR(64) NOT NULL DEFAULT 'diagnostic-report-v1',
    `promptVersion` VARCHAR(64) NULL,
    `modelName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiagnosticReportTask_examRecordId_key`(`examRecordId`),
    INDEX `DiagnosticReportTask_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `DiagnosticReportTask_userId_paperId_createdAt_idx`(`userId`, `paperId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosticReport` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `examRecordId` VARCHAR(191) NOT NULL,
    `reportKind` VARCHAR(32) NOT NULL,
    `result` JSON NOT NULL,
    `sourceSnapshot` JSON NULL,
    `reportVersion` VARCHAR(64) NOT NULL DEFAULT 'diagnostic-report-v1',
    `promptVersion` VARCHAR(64) NULL,
    `modelName` VARCHAR(100) NULL,
    `generationMode` VARCHAR(32) NOT NULL DEFAULT 'rules_only',
    `completedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiagnosticReport_examRecordId_key`(`examRecordId`),
    INDEX `DiagnosticReport_userId_completedAt_idx`(`userId`, `completedAt`),
    INDEX `DiagnosticReport_paperId_idx`(`paperId`),
    UNIQUE INDEX `DiagnosticReport_userId_paperId_key`(`userId`, `paperId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `AnswerRecord_examRecordId_questionId_key` ON `AnswerRecord`(`examRecordId`, `questionId`);

-- CreateIndex
CREATE UNIQUE INDEX `ExamRecord_submissionKey_key` ON `ExamRecord`(`submissionKey`);

-- CreateIndex
CREATE INDEX `ExamRecord_userId_paperId_status_idx` ON `ExamRecord`(`userId`, `paperId`, `status`);

-- AddForeignKey
ALTER TABLE `DiagnosticReportTask` ADD CONSTRAINT `DiagnosticReportTask_examRecordId_fkey` FOREIGN KEY (`examRecordId`) REFERENCES `ExamRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticReportTask` ADD CONSTRAINT `DiagnosticReportTask_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticReportTask` ADD CONSTRAINT `DiagnosticReportTask_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticReport` ADD CONSTRAINT `DiagnosticReport_examRecordId_fkey` FOREIGN KEY (`examRecordId`) REFERENCES `ExamRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticReport` ADD CONSTRAINT `DiagnosticReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticReport` ADD CONSTRAINT `DiagnosticReport_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `AnswerRecord` RENAME INDEX `AnswerRecord_questionId_fkey` TO `AnswerRecord_questionId_idx`;
