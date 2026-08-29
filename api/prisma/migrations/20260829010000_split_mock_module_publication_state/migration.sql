-- DropIndex
DROP INDEX `MockPaperModule_sourceModuleId_key` ON `mockpapermodule`;

-- AlterTable
ALTER TABLE `mockpapermodule` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `publicationStatus` VARCHAR(32) NOT NULL DEFAULT 'draft',
    ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `mockpaperset` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `MockPaperModule_publicationStatus_validationStatus_idx` ON `MockPaperModule`(`publicationStatus`, `validationStatus`);

-- BackfillData
UPDATE `MockPaperModule` AS `module`
INNER JOIN `MockPaperSet` AS `paperSet` ON `paperSet`.`id` = `module`.`mockPaperSetId`
LEFT JOIN `Paper` AS `paper` ON `paper`.`id` = `paperSet`.`paperId`
SET
  `module`.`publicationStatus` = CASE
    WHEN `paperSet`.`status` = 'archived' THEN 'archived'
    WHEN `paperSet`.`status` = 'published'
      AND `paper`.`status` = 'published'
      AND `module`.`validationStatus` = 'valid' THEN 'published'
    ELSE 'draft'
  END,
  `module`.`publishedAt` = CASE
    WHEN `paperSet`.`status` = 'published'
      AND `paper`.`status` = 'published'
      AND `module`.`validationStatus` = 'valid' THEN `paperSet`.`publishedAt`
    ELSE NULL
  END,
  `module`.`archivedAt` = CASE
    WHEN `paperSet`.`status` = 'archived' THEN `paperSet`.`archivedAt`
    ELSE NULL
  END;

-- Published incomplete sets represented published single modules in the legacy model.
-- Keep their runtime Paper published, but restore the suite itself to draft.
UPDATE `MockPaperSet`
SET `status` = 'draft', `publishedAt` = NULL
WHERE `status` = 'published' AND `fullExamReady` = FALSE;
