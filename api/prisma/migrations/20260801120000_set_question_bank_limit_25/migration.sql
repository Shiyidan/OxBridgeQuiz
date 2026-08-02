-- AlterTable
ALTER TABLE `entitlementconfig` MODIFY `questionBankLimit` INTEGER NOT NULL DEFAULT 25;

-- Normalize existing per-exam free question-bank quota configurations to the current product rule.
UPDATE `EntitlementConfig`
SET `questionBankLimit` = 25,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `questionBankLimit` <> 25;
