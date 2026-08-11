-- AlterTable
ALTER TABLE `invitationreward` MODIFY `status` VARCHAR(32) NOT NULL DEFAULT 'pending_activation';

-- MigrateData
UPDATE `InvitationReward`
SET `status` = 'pending_activation'
WHERE `status` = 'pending_payment';

UPDATE `InvitationReward`
SET `status` = 'activated'
WHERE `status` IN ('queued', 'active', 'completed');
