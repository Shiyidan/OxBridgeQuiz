-- Add foreign key from AnswerRecord.questionId to Question.id

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnswerRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examRecordId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" DATETIME,
    CONSTRAINT "AnswerRecord_examRecordId_fkey" FOREIGN KEY ("examRecordId") REFERENCES "ExamRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnswerRecord_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AnswerRecord" ("answeredAt", "durationSeconds", "examRecordId", "id", "isCorrect", "questionId", "selectedAnswer") SELECT "answeredAt", "durationSeconds", "examRecordId", "id", "isCorrect", "questionId", "selectedAnswer" FROM "AnswerRecord";
DROP TABLE "AnswerRecord";
ALTER TABLE "new_AnswerRecord" RENAME TO "AnswerRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
