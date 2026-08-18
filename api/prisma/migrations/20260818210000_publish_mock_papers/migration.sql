-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `startRequestKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `MockPaperSet` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `paperId` VARCHAR(191) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ExamRecord_startRequestKey_key` ON `ExamRecord`(`startRequestKey`);

-- CreateIndex
CREATE UNIQUE INDEX `MockPaperSet_paperId_key` ON `MockPaperSet`(`paperId`);

-- AddForeignKey
ALTER TABLE `MockPaperSet` ADD CONSTRAINT `MockPaperSet_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
