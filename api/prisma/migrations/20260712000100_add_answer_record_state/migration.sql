-- AlterTable
ALTER TABLE `AnswerRecord` ADD COLUMN `answerState` VARCHAR(16) NOT NULL DEFAULT 'unseen';

-- BackfillState
UPDATE `AnswerRecord`
SET `answerState` = CASE
  WHEN `selectedAnswer` IS NOT NULL AND TRIM(`selectedAnswer`) <> '' THEN 'answered'
  WHEN `durationSeconds` > 0 THEN 'skipped'
  ELSE 'unseen'
END;
