-- Replace the first-purchase/yearly strategy with monthly and quarterly pricing.
ALTER TABLE `PaymentConfig` DROP COLUMN `firstMonthlyPriceCents`,
    DROP COLUMN `yearlyPriceCents`,
    ADD COLUMN `quarterlyOriginalPriceCents` INTEGER NOT NULL DEFAULT 59400,
    ADD COLUMN `quarterlyPriceCents` INTEGER NOT NULL DEFAULT 35600,
    MODIFY `monthlyPriceCents` INTEGER NOT NULL DEFAULT 19800;

-- Activate the approved prices for the existing global configuration row.
UPDATE `PaymentConfig`
SET `monthlyPriceCents` = 19800,
    `quarterlyOriginalPriceCents` = 59400,
    `quarterlyPriceCents` = 35600;
