-- Create uploaded syllabus library table.
CREATE TABLE "Syllabus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "sourceJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "Syllabus_examType_idx" ON "Syllabus"("examType");
CREATE INDEX "Syllabus_isActive_idx" ON "Syllabus"("isActive");
