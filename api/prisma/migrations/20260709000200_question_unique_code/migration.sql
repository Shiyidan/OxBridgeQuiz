ALTER TABLE `Question` ADD COLUMN `uniqueCode` VARCHAR(191) NULL;

UPDATE `Question`
SET `uniqueCode` = CONCAT(REPLACE(`paperId`, '-', ''), LPAD(`number`, 4, '0'))
WHERE `uniqueCode` IS NULL;

ALTER TABLE `Question` MODIFY `uniqueCode` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `Question_uniqueCode_key` ON `Question`(`uniqueCode`);
