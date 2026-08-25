-- AlterTable
ALTER TABLE `MockPaperModule` ADD COLUMN `validationStatus` VARCHAR(32) NOT NULL DEFAULT 'invalid';

-- AlterTable
ALTER TABLE `MockPaperSet` ADD COLUMN `fullExamReady` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `readyModuleCount` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `MockPaperModule_mockPaperSetId_validationStatus_idx` ON `MockPaperModule`(`mockPaperSetId`, `validationStatus`);
