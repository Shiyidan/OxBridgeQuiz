-- Create Question table to replace Paper.questions JSON blob

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "answer" TEXT NOT NULL DEFAULT '[]',
    "subject" TEXT,
    "subjectCode" TEXT,
    "questionType" TEXT,
    "difficulty" TEXT,
    "topic" TEXT,
    "topicCode" TEXT,
    "knowledgePoints" TEXT NOT NULL DEFAULT '[]',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Question_paperId_idx" ON "Question"("paperId");

-- CreateIndex
CREATE INDEX "Question_subjectCode_idx" ON "Question"("subjectCode");

-- CreateIndex
CREATE INDEX "Question_number_idx" ON "Question"("number");
