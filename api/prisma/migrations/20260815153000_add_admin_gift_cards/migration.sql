-- AlterTable
ALTER TABLE `invitationreward` ADD COLUMN `sourceType` VARCHAR(32) NOT NULL DEFAULT 'invitation',
    MODIFY `invitationRelationId` VARCHAR(191) NULL;
