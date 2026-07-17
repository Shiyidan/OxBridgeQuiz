-- AlterTable
ALTER TABLE `OperationLog` ADD COLUMN `requestId` VARCHAR(64) NULL;

-- CreateIndex
CREATE INDEX `OperationLog_requestId_idx` ON `OperationLog`(`requestId`);
