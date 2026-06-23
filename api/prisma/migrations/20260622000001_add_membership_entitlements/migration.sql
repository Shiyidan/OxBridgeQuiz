-- Add exam type ownership and membership entitlement tables.
ALTER TABLE "Paper" ADD COLUMN "examType" TEXT NOT NULL DEFAULT 'TMUA';
ALTER TABLE "Question" ADD COLUMN "examType" TEXT NOT NULL DEFAULT 'TMUA';
ALTER TABLE "DiagnosticSession" ADD COLUMN "examType" TEXT NOT NULL DEFAULT 'TMUA';
ALTER TABLE "ExamRecord" ADD COLUMN "examType" TEXT NOT NULL DEFAULT 'TMUA';

CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examType" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "UserMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EntitlementConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examType" TEXT NOT NULL,
    "diagnosticLimit" INTEGER NOT NULL DEFAULT 2,
    "questionBankLimit" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "Paper_examType_idx" ON "Paper"("examType");
CREATE INDEX "Question_examType_idx" ON "Question"("examType");
CREATE INDEX "DiagnosticSession_examType_idx" ON "DiagnosticSession"("examType");
CREATE INDEX "ExamRecord_userId_examType_idx" ON "ExamRecord"("userId", "examType");
CREATE INDEX "ExamRecord_examType_idx" ON "ExamRecord"("examType");
CREATE UNIQUE INDEX "MembershipPlan_examType_plan_key" ON "MembershipPlan"("examType", "plan");
CREATE INDEX "MembershipPlan_examType_idx" ON "MembershipPlan"("examType");
CREATE INDEX "UserMembership_userId_idx" ON "UserMembership"("userId");
CREATE INDEX "UserMembership_examType_idx" ON "UserMembership"("examType");
CREATE INDEX "UserMembership_userId_examType_status_idx" ON "UserMembership"("userId", "examType", "status");
CREATE UNIQUE INDEX "EntitlementConfig_examType_key" ON "EntitlementConfig"("examType");
