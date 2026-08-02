-- AlterTable
ALTER TABLE `question` ADD COLUMN `qualityTier` VARCHAR(32) NULL;

-- Backfill the list-facing value before admin queries stop reading the full meta JSON.
UPDATE `question`
SET `qualityTier` = JSON_UNQUOTE(JSON_EXTRACT(`meta`, '$.qualityTier'))
WHERE JSON_UNQUOTE(JSON_EXTRACT(`meta`, '$.qualityTier')) IN ('qualified', 'excellent');
