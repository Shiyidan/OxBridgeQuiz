-- CreateTable
CREATE TABLE `MockPaperWorkbookUpload` (
    `id` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `contentType` VARCHAR(128) NOT NULL,
    `fileSizeBytes` INTEGER NOT NULL,
    `checksumSha256` CHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'processing',
    `setCount` INTEGER NOT NULL DEFAULT 0,
    `moduleCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `MockPaperWorkbookUpload_storageKey_key`(`storageKey`),
    INDEX `MockPaperWorkbookUpload_createdAt_idx`(`createdAt`),
    INDEX `MockPaperWorkbookUpload_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `MockPaperWorkbookUpload_uploadedById_createdAt_idx`(`uploadedById`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MockPaperWorkbookUpload` ADD CONSTRAINT `MockPaperWorkbookUpload_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
