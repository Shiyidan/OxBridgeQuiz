-- AlterTable
ALTER TABLE `EntitlementConfig` MODIFY `diagnosticLimit` INTEGER NOT NULL DEFAULT 1,
    MODIFY `questionBankLimit` INTEGER NOT NULL DEFAULT 1;

-- Normalize existing per-exam free quota configurations to the current product rule.
UPDATE `EntitlementConfig`
SET `diagnosticLimit` = 1,
    `questionBankLimit` = 1,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `diagnosticLimit` <> 1 OR `questionBankLimit` <> 1;
