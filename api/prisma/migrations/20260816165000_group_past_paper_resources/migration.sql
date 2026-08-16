-- AlterTable
ALTER TABLE `StudyResource`
    ADD COLUMN `bundleKey` VARCHAR(191) NULL,
    ADD COLUMN `fileRole` VARCHAR(32) NOT NULL DEFAULT 'main',
    ADD COLUMN `resourceYear` INTEGER NULL;

-- Backfill every existing single-file resource as its own stable bundle.
UPDATE `StudyResource`
SET `bundleKey` = `id`;

-- Infer the year and role for legacy past-paper filenames such as ENGAA_2016_S1_QuestionPaper.pdf.
UPDATE `StudyResource`
SET `resourceYear` = CAST(
  REGEXP_SUBSTR(CONCAT(`title`, ' ', `originalFileName`), '(19|20)[0-9]{2}') AS UNSIGNED
)
WHERE `category` = 'past_paper'
  AND REGEXP_SUBSTR(CONCAT(`title`, ' ', `originalFileName`), '(19|20)[0-9]{2}') IS NOT NULL;

UPDATE `StudyResource`
SET `fileRole` = CASE
  WHEN LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%answer%'
    OR LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%solution%'
    OR LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%markscheme%'
    OR LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%mark_scheme%'
    THEN 'answer'
  WHEN LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%question%'
    OR LOWER(CONCAT(`title`, ' ', `originalFileName`)) LIKE '%questionpaper%'
    THEN 'question'
  ELSE 'main'
END
WHERE `category` = 'past_paper';

UPDATE `StudyResource`
SET `bundleKey` = CONCAT('past-paper:', `examType`, ':', `resourceYear`)
WHERE `category` = 'past_paper'
  AND `resourceYear` IS NOT NULL;

ALTER TABLE `StudyResource`
    MODIFY `bundleKey` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `StudyResource_bundleKey_idx` ON `StudyResource`(`bundleKey`);

-- CreateIndex
CREATE INDEX `StudyResource_category_examType_resourceYear_idx`
ON `StudyResource`(`category`, `examType`, `resourceYear`);
