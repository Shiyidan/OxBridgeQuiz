-- DropIndex
DROP INDEX `MockPaperSet_validationStatus_updatedAt_idx` ON `mockpaperset`;

-- AlterTable
ALTER TABLE `mockpaperset` DROP COLUMN `fullExamReady`,
    DROP COLUMN `readyModuleCount`,
    DROP COLUMN `validationStatus`;
