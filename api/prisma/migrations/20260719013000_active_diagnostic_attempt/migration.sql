-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `activeDiagnosticKey` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ExamRecord_activeDiagnosticKey_key` ON `ExamRecord`(`activeDiagnosticKey`);
