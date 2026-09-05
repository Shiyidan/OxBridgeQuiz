-- AlterTable
ALTER TABLE `mockpapermodule` ADD COLUMN `accessTier` VARCHAR(32) NULL;

-- Backfill existing single-paper access from its owning set before making the field required.
UPDATE `mockpapermodule` AS `module`
INNER JOIN `mockpaperset` AS `paperSet` ON `paperSet`.`id` = `module`.`mockPaperSetId`
SET `module`.`accessTier` = `paperSet`.`accessTier`;

-- AlterTable
ALTER TABLE `mockpapermodule`
    MODIFY `accessTier` VARCHAR(32) NOT NULL DEFAULT 'member';
