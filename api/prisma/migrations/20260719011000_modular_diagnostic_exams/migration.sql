-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `activeDurationSeconds` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `currentModuleIndex` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `phase` VARCHAR(32) NOT NULL DEFAULT 'continuous',
    ADD COLUMN `phaseExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `phaseStartedAt` DATETIME(3) NULL,
    ADD COLUMN `structureSnapshot` JSON NULL;

-- AlterTable
ALTER TABLE `Paper` ADD COLUMN `assemblyType` VARCHAR(32) NOT NULL DEFAULT 'original',
    ADD COLUMN `breakDurationSeconds` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `deliveryMode` VARCHAR(32) NOT NULL DEFAULT 'continuous',
    ADD COLUMN `moduleConfig` JSON NULL,
    ADD COLUMN `remarks` TEXT NULL,
    ADD COLUMN `sourceExamTypes` JSON NULL;

-- AlterTable
ALTER TABLE `Question` ADD COLUMN `moduleCode` VARCHAR(32) NULL,
    ADD COLUMN `moduleOrder` INTEGER NULL,
    ADD COLUMN `moduleQuestionNumber` INTEGER NULL,
    ADD COLUMN `sourceQuestionCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Question_sourceQuestionCode_idx` ON `Question`(`sourceQuestionCode`);

-- CreateIndex
CREATE INDEX `Question_paperId_moduleOrder_moduleQuestionNumber_idx` ON `Question`(`paperId`, `moduleOrder`, `moduleQuestionNumber`);
