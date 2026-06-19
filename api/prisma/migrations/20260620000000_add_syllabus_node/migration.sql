-- Create SyllabusNode table for hierarchical knowledge point tree

-- CreateTable
CREATE TABLE "SyllabusNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "parentCode" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusNode_examType_code_key" ON "SyllabusNode"("examType", "code");

-- CreateIndex
CREATE INDEX "SyllabusNode_examType_idx" ON "SyllabusNode"("examType");

-- CreateIndex
CREATE INDEX "SyllabusNode_parentCode_idx" ON "SyllabusNode"("parentCode");
