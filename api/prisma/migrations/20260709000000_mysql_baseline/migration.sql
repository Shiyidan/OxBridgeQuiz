-- CreateTable
CREATE TABLE `Paper` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NULL,
    `examType` VARCHAR(32) NOT NULL DEFAULT 'TMUA',
    `year` INTEGER NOT NULL,
    `duration` INTEGER NOT NULL,
    `totalQuestions` INTEGER NOT NULL DEFAULT 0,
    `paperType` VARCHAR(32) NOT NULL DEFAULT 'realPaper',
    `pdfUrl` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `questions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Paper_examType_idx`(`examType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL DEFAULT 'TMUA',
    `number` INTEGER NOT NULL,
    `title` LONGTEXT NOT NULL,
    `options` JSON NOT NULL,
    `answer` JSON NOT NULL,
    `subject` VARCHAR(100) NULL,
    `subjectCode` VARCHAR(64) NULL,
    `questionType` VARCHAR(64) NULL,
    `difficulty` VARCHAR(32) NULL,
    `topic` VARCHAR(255) NULL,
    `topicCode` VARCHAR(64) NULL,
    `knowledgePoints` JSON NOT NULL,
    `syllabusPoints` JSON NOT NULL,
    `meta` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Question_paperId_idx`(`paperId`),
    INDEX `Question_examType_idx`(`examType`),
    INDEX `Question_subjectCode_idx`(`subjectCode`),
    INDEX `Question_number_idx`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParseTask` (
    `id` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,
    `result` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'student',
    `paymentStatus` VARCHAR(32) NOT NULL DEFAULT 'free',
    `diagnosticUsed` BOOLEAN NOT NULL DEFAULT false,
    `avatar` TEXT NULL,
    `examPreferences` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosticSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `examType` VARCHAR(32) NOT NULL DEFAULT 'TMUA',
    `answers` JSON NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `correctCount` INTEGER NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'anonymous',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiagnosticSession_userId_idx`(`userId`),
    INDEX `DiagnosticSession_examType_idx`(`examType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamRecord` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL DEFAULT 'TMUA',
    `totalQuestions` INTEGER NOT NULL DEFAULT 0,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'in_progress',

    INDEX `ExamRecord_userId_examType_idx`(`userId`, `examType`),
    INDEX `ExamRecord_examType_idx`(`examType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerRecord` (
    `id` VARCHAR(191) NOT NULL,
    `examRecordId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selectedAnswer` VARCHAR(64) NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    `answeredAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SyllabusNode` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `label` VARCHAR(512) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `parentCode` VARCHAR(100) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SyllabusNode_examType_idx`(`examType`),
    INDEX `SyllabusNode_parentCode_idx`(`parentCode`),
    UNIQUE INDEX `SyllabusNode_examType_code_key`(`examType`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Syllabus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `sourceJson` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Syllabus_examType_idx`(`examType`),
    INDEX `Syllabus_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RevenueCost` (
    `id` VARCHAR(191) NOT NULL,
    `rechargeItem` VARCHAR(100) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `operator` VARCHAR(100) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `reimbursementStatus` VARCHAR(32) NOT NULL DEFAULT 'unreimbursed',
    `remark` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RevenueCost_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MembershipPlan` (
    `id` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `plan` VARCHAR(32) NOT NULL,
    `priceCents` INTEGER NOT NULL DEFAULT 0,
    `durationDays` INTEGER NOT NULL DEFAULT 30,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MembershipPlan_examType_idx`(`examType`),
    UNIQUE INDEX `MembershipPlan_examType_plan_key`(`examType`, `plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMembership` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `plan` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserMembership_userId_idx`(`userId`),
    INDEX `UserMembership_examType_idx`(`examType`),
    INDEX `UserMembership_userId_examType_status_idx`(`userId`, `examType`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntitlementConfig` (
    `id` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `diagnosticLimit` INTEGER NOT NULL DEFAULT 2,
    `questionBankLimit` INTEGER NOT NULL DEFAULT 100,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EntitlementConfig_examType_key`(`examType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParseTask` ADD CONSTRAINT `ParseTask_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticSession` ADD CONSTRAINT `DiagnosticSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamRecord` ADD CONSTRAINT `ExamRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamRecord` ADD CONSTRAINT `ExamRecord_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerRecord` ADD CONSTRAINT `AnswerRecord_examRecordId_fkey` FOREIGN KEY (`examRecordId`) REFERENCES `ExamRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerRecord` ADD CONSTRAINT `AnswerRecord_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMembership` ADD CONSTRAINT `UserMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

