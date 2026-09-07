-- DropIndex
DROP INDEX `MockPaperSet_code_key` ON `MockPaperSet`;

-- DropIndex
DROP INDEX `MockPaperSet_examType_status_sequenceNo_idx` ON `MockPaperSet`;

-- DropIndex
DROP INDEX `MockPaperSet_examType_sequenceNo_version_key` ON `MockPaperSet`;

-- DropIndex
DROP INDEX `MockPaperModule_sourceModuleId_key` ON `MockPaperModule`;

-- AlterTable
ALTER TABLE `MockPaperSet` DROP COLUMN `code`,
    DROP COLUMN `sequenceNo`,
    MODIFY `versionGroupId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `MockPaperSet_examType_status_idx` ON `MockPaperSet`(`examType`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `MockPaperSet_seriesId_version_key` ON `MockPaperSet`(`seriesId`, `version`);

-- CreateIndex
CREATE UNIQUE INDEX `MockPaperSet_versionGroupId_version_key` ON `MockPaperSet`(`versionGroupId`, `version`);
