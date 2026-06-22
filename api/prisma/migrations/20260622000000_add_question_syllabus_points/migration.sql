-- Add syllabus point JSON column used by question bank and mistake notebook filters.
ALTER TABLE "Question" ADD COLUMN "syllabusPoints" TEXT NOT NULL DEFAULT '[]';
