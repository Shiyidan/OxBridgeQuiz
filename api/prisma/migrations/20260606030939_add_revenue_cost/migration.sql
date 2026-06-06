-- CreateTable
CREATE TABLE "RevenueCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rechargeItem" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "operator" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "reimbursementStatus" TEXT NOT NULL DEFAULT 'unreimbursed',
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RevenueCost_occurredAt_idx" ON "RevenueCost"("occurredAt");
