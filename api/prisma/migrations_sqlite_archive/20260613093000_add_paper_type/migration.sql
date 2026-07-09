-- Add paper type for separating past papers, practice sets, and diagnostic sets.
ALTER TABLE "Paper" ADD COLUMN "paperType" TEXT NOT NULL DEFAULT 'past';
