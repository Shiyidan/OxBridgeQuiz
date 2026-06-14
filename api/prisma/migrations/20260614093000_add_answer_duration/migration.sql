-- Add per-question duration tracking for exam answer records.
ALTER TABLE "AnswerRecord" ADD COLUMN "durationSeconds" INTEGER NOT NULL DEFAULT 0;
