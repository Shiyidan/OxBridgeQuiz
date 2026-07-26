-- AlterTable
ALTER TABLE `Paper` ADD COLUMN `accessTier` VARCHAR(32) NOT NULL DEFAULT 'member';

-- CreateIndex
CREATE INDEX `Paper_examType_accessTier_status_idx` ON `Paper`(`examType`, `accessTier`, `status`);
