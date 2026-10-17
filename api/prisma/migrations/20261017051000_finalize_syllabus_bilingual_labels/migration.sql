-- AlterTable
ALTER TABLE `syllabusnode` DROP COLUMN `label`,
    MODIFY `cnLabel` VARCHAR(512) NOT NULL,
    MODIFY `enLabel` VARCHAR(512) NOT NULL;

