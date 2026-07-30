-- AlterTable
ALTER TABLE `entitlementconfig` MODIFY `questionBankLimit` INTEGER NOT NULL DEFAULT 100;

-- Normalize existing per-exam free question-bank quota configurations to the confirmed product rule.
UPDATE `EntitlementConfig`
SET `questionBankLimit` = 100,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `questionBankLimit` <> 100;
