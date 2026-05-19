-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "year" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "questions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Paper" ("code", "createdAt", "duration", "id", "pdfUrl", "questions", "status", "title", "totalQuestions", "updatedAt", "year") SELECT "code", "createdAt", "duration", "id", "pdfUrl", "questions", "status", "title", "totalQuestions", "updatedAt", "year" FROM "Paper";
DROP TABLE "Paper";
ALTER TABLE "new_Paper" RENAME TO "Paper";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
