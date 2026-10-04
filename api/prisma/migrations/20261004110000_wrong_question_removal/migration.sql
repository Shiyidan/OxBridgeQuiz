-- DropIndex
DROP INDEX `WrongQuestionSummary_userId_examType_latestWrongAt_id_idx` ON `wrongquestionsummary`;

-- AlterTable
ALTER TABLE `wrongquestionsummary` ADD COLUMN `removedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `WrongQuestionSummary_userId_examType_removedAt_latestWrongAt_idx` ON `WrongQuestionSummary`(`userId`, `examType`, `removedAt`, `latestWrongAt`, `id`);
