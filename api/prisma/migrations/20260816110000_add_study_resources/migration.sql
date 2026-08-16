-- CreateTable
CREATE TABLE `StudyResource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `examType` VARCHAR(32) NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `accessTier` VARCHAR(32) NOT NULL DEFAULT 'free',
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `originalFileName` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    `fileSizeBytes` INTEGER NOT NULL,
    `checksumSha256` CHAR(64) NOT NULL,
    `uploadedById` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudyResource_storageKey_key`(`storageKey`),
    INDEX `StudyResource_examType_category_status_idx`(`examType`, `category`, `status`),
    INDEX `StudyResource_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `StudyResource_uploadedById_createdAt_idx`(`uploadedById`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudyResource` ADD CONSTRAINT `StudyResource_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
