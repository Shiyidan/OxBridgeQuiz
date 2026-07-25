-- DropIndex
DROP INDEX `DiagnosticReport_userId_paperId_key` ON `DiagnosticReport`;

-- CreateIndex
CREATE INDEX `DiagnosticReport_userId_paperId_completedAt_idx`
ON `DiagnosticReport`(`userId`, `paperId`, `completedAt`);

-- BackfillReportHistory
INSERT INTO `DiagnosticReport` (
  `id`,
  `userId`,
  `paperId`,
  `examRecordId`,
  `reportKind`,
  `result`,
  `sourceSnapshot`,
  `reportVersion`,
  `promptVersion`,
  `modelName`,
  `generationMode`,
  `completedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  task.`userId`,
  task.`paperId`,
  task.`examRecordId`,
  task.`reportKind`,
  task.`result`,
  NULL,
  task.`reportVersion`,
  task.`promptVersion`,
  task.`modelName`,
  COALESCE(task.`generationMode`, 'rules_only'),
  COALESCE(task.`completedAt`, task.`updatedAt`),
  COALESCE(task.`completedAt`, task.`updatedAt`),
  task.`updatedAt`
FROM `DiagnosticReportTask` AS task
LEFT JOIN `DiagnosticReport` AS report
  ON report.`examRecordId` = task.`examRecordId`
WHERE
  task.`status` = 'completed'
  AND task.`result` IS NOT NULL
  AND report.`id` IS NULL;
