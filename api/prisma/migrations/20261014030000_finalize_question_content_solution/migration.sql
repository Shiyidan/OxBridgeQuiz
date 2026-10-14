-- AlterTable
ALTER TABLE `Question` DROP COLUMN `answer`,
    DROP COLUMN `options`,
    DROP COLUMN `syllabusPoints`,
    MODIFY `content` JSON NOT NULL,
    MODIFY `solution` JSON NOT NULL;
