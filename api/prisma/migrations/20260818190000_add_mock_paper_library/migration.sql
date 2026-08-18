-- CreateTable
CREATE TABLE `MockPaperSet` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `sequenceNo` INTEGER NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `accessTier` VARCHAR(32) NOT NULL DEFAULT 'member',
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `version` INTEGER NOT NULL DEFAULT 1,
    `sourceFileName` VARCHAR(255) NULL,
    `validationStatus` VARCHAR(32) NOT NULL DEFAULT 'invalid',
    `issueCount` INTEGER NOT NULL DEFAULT 0,
    `questionCount` INTEGER NOT NULL DEFAULT 0,
    `issues` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MockPaperSet_code_key`(`code`),
    INDEX `MockPaperSet_examType_status_sequenceNo_idx`(`examType`, `status`, `sequenceNo`),
    INDEX `MockPaperSet_validationStatus_updatedAt_idx`(`validationStatus`, `updatedAt`),
    UNIQUE INDEX `MockPaperSet_examType_sequenceNo_version_key`(`examType`, `sequenceNo`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockPaperModule` (
    `id` VARCHAR(191) NOT NULL,
    `mockPaperSetId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `moduleOrder` INTEGER NOT NULL,
    `durationSeconds` INTEGER NOT NULL,
    `expectedQuestionCount` INTEGER NOT NULL,
    `questionCount` INTEGER NOT NULL DEFAULT 0,
    `issueCount` INTEGER NOT NULL DEFAULT 0,
    `issues` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MockPaperModule_mockPaperSetId_moduleOrder_idx`(`mockPaperSetId`, `moduleOrder`),
    UNIQUE INDEX `MockPaperModule_mockPaperSetId_code_key`(`mockPaperSetId`, `code`),
    UNIQUE INDEX `MockPaperModule_mockPaperSetId_moduleOrder_key`(`mockPaperSetId`, `moduleOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockPaperQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NULL,
    `sourceCode` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `validationStatus` VARCHAR(32) NOT NULL DEFAULT 'invalid',
    `issues` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MockPaperQuestion_moduleId_sourceCode_idx`(`moduleId`, `sourceCode`),
    INDEX `MockPaperQuestion_questionId_idx`(`questionId`),
    UNIQUE INDEX `MockPaperQuestion_moduleId_position_key`(`moduleId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MockPaperModule` ADD CONSTRAINT `MockPaperModule_mockPaperSetId_fkey` FOREIGN KEY (`mockPaperSetId`) REFERENCES `MockPaperSet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockPaperQuestion` ADD CONSTRAINT `MockPaperQuestion_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `MockPaperModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockPaperQuestion` ADD CONSTRAINT `MockPaperQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
