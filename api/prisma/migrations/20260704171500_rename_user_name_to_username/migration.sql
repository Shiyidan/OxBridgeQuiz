-- Rename the login identifier field while preserving existing user values.
ALTER TABLE "User" RENAME COLUMN "name" TO "username";

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
