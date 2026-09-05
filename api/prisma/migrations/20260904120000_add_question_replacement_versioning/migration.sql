-- AlterTable
ALTER TABLE `Question` ADD COLUMN `replacesQuestionId` VARCHAR(191) NULL,
    ADD COLUMN `revisionReason` VARCHAR(64) NULL,
    ADD COLUMN `revisionVersion` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Question_replacesQuestionId_key` ON `Question`(`replacesQuestionId`);

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_replacesQuestionId_fkey` FOREIGN KEY (`replacesQuestionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
