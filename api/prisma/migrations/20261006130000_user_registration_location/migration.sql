-- AlterTable
ALTER TABLE `User` ADD COLUMN `registrationCountry` VARCHAR(128) NULL,
    ADD COLUMN `registrationLocationNextCheckAt` DATETIME(3) NULL,
    ADD COLUMN `registrationLocationUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `registrationRegion` VARCHAR(128) NULL;

-- CreateIndex
CREATE INDEX `User_registrationLocationNextCheckAt_createdAt_idx` ON `User`(`registrationLocationNextCheckAt`, `createdAt`);
