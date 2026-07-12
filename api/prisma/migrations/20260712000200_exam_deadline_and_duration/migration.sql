-- AlterTable
ALTER TABLE `ExamRecord` ADD COLUMN `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `expiresAt` DATETIME(3) NULL;

-- BackfillDuration
UPDATE `ExamRecord` er
SET er.`durationSeconds` = (
  SELECT COALESCE(SUM(ar.`durationSeconds`), 0)
  FROM `AnswerRecord` ar
  WHERE ar.`examRecordId` = er.`id`
);

-- BackfillDeadline
UPDATE `ExamRecord` er
INNER JOIN `Paper` p ON p.`id` = er.`paperId`
SET er.`expiresAt` = DATE_ADD(er.`startedAt`, INTERVAL p.`duration` MINUTE)
WHERE p.`paperType` IN ('realPaper', 'mockPaper');
