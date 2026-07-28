-- AlterTable
ALTER TABLE `AnswerRecord` ADD COLUMN `position` INTEGER NULL;

-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `activeQuestionBankKey` VARCHAR(191) NULL;

-- Backfill the newest legacy in-progress question-bank practice for each user and exam type.
UPDATE `ExamRecord` AS `target`
INNER JOIN (
  SELECT `ranked`.`id`, CONCAT(`ranked`.`userId`, ':', `ranked`.`examType`) AS `activeKey`
  FROM (
    SELECT
      `record`.`id`,
      `record`.`userId`,
      `record`.`examType`,
      ROW_NUMBER() OVER (
        PARTITION BY `record`.`userId`, `record`.`examType`
        ORDER BY `record`.`startedAt` DESC, `record`.`id` DESC
      ) AS `rowNumber`
    FROM `ExamRecord` AS `record`
    INNER JOIN `Paper` AS `sourcePaper` ON `sourcePaper`.`id` = `record`.`paperId`
    WHERE `record`.`status` = 'in_progress'
      AND `sourcePaper`.`paperType` = 'aiPaper'
  ) AS `ranked`
  WHERE `ranked`.`rowNumber` = 1
) AS `latest` ON `latest`.`id` = `target`.`id`
SET `target`.`activeQuestionBankKey` = `latest`.`activeKey`;

-- CreateIndex
CREATE UNIQUE INDEX `ExamRecord_activeQuestionBankKey_key`
ON `ExamRecord`(`activeQuestionBankKey`);
