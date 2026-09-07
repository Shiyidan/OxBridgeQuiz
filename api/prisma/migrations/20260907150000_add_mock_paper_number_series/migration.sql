-- AlterTable
ALTER TABLE `MockPaperSet` ADD COLUMN `legacyCode` VARCHAR(100) NULL,
    ADD COLUMN `seriesId` VARCHAR(191) NULL,
    ADD COLUMN `versionGroupId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `MockPaperModule` ADD COLUMN `seriesId` VARCHAR(191) NULL,
    ADD COLUMN `version` INTEGER NULL;

-- CreateTable
CREATE TABLE `MockPaperSeries` (
    `id` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `moduleCode` VARCHAR(32) NOT NULL DEFAULT '',
    `sequenceNo` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MockPaperSeries_examType_kind_moduleCode_sequenceNo_key`(`examType`, `kind`, `moduleCode`, `sequenceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockPaperNumberCounter` (
    `id` VARCHAR(100) NOT NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `MockPaperSet_legacyCode_key` ON `MockPaperSet`(`legacyCode`);

-- CreateIndex
CREATE UNIQUE INDEX `MockPaperModule_seriesId_version_key` ON `MockPaperModule`(`seriesId`, `version`);

-- AddForeignKey
ALTER TABLE `MockPaperSet` ADD CONSTRAINT `MockPaperSet_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `MockPaperSeries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MockPaperModule` ADD CONSTRAINT `MockPaperModule_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `MockPaperSeries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
