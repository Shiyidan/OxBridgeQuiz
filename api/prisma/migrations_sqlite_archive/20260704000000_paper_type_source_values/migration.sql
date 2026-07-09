-- Redefine Paper.paperType as a source type and normalize legacy values.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "examType" TEXT NOT NULL DEFAULT 'TMUA',
    "year" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "paperType" TEXT NOT NULL DEFAULT 'realTest',
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "questions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Paper" (
    "code",
    "createdAt",
    "duration",
    "examType",
    "id",
    "paperType",
    "pdfUrl",
    "questions",
    "status",
    "title",
    "totalQuestions",
    "updatedAt",
    "year"
)
SELECT
    "code",
    "createdAt",
    "duration",
    "examType",
    "id",
    CASE "paperType"
        WHEN 'past' THEN 'realTest'
        WHEN 'diagnostic' THEN 'realTest'
        WHEN 'mock' THEN 'mockTest'
        WHEN 'practice' THEN 'aiGeneratedTest'
        ELSE "paperType"
    END,
    "pdfUrl",
    "questions",
    "status",
    "title",
    "totalQuestions",
    "updatedAt",
    "year"
FROM "Paper";

DROP TABLE "Paper";
ALTER TABLE "new_Paper" RENAME TO "Paper";
CREATE INDEX "Paper_examType_idx" ON "Paper"("examType");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
