-- AlterTable
ALTER TABLE `WebsiteVisitDaily` ADD COLUMN `hasUnattributedVisit` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `_WebsiteVisitUsers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_WebsiteVisitUsers_AB_unique`(`A`, `B`),
    INDEX `_WebsiteVisitUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_WebsiteVisitUsers` ADD CONSTRAINT `_WebsiteVisitUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WebsiteVisitUsers` ADD CONSTRAINT `_WebsiteVisitUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `WebsiteVisitDaily`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
