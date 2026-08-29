-- A source module can belong to only one active composed suite at a time.
-- Draft soft deletion clears sourceModuleId from its composed copies before the set is hidden.
CREATE UNIQUE INDEX `MockPaperModule_sourceModuleId_key`
ON `MockPaperModule`(`sourceModuleId`);
