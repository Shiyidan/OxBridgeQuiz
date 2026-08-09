-- NormalizeData
UPDATE `question`
SET `difficulty` = 'hard'
WHERE `difficulty` = 'composite';

UPDATE `question`
SET `difficulty` = NULL
WHERE `difficulty` IS NOT NULL
  AND `difficulty` NOT IN ('easy', 'medium', 'hard');

-- AlterTable
ALTER TABLE `question` MODIFY `difficulty` ENUM('easy', 'medium', 'hard') NULL;
