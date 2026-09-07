-- DropIndex
DROP INDEX `MockPaperSet_legacyCode_key` ON `MockPaperSet`;

-- AlterTable
ALTER TABLE `MockPaperSet` DROP COLUMN `legacyCode`;

