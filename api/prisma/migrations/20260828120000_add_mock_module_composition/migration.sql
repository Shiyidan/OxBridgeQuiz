-- AlterTable
ALTER TABLE `mockpapermodule` ADD COLUMN `sourceModuleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `MockPaperModule_sourceModuleId_idx` ON `MockPaperModule`(`sourceModuleId`);

-- AddForeignKey
ALTER TABLE `MockPaperModule` ADD CONSTRAINT `MockPaperModule_sourceModuleId_fkey` FOREIGN KEY (`sourceModuleId`) REFERENCES `MockPaperModule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
