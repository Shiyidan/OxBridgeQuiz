-- AlterTable
ALTER TABLE `question` ADD COLUMN `attemptPayload` JSON NULL;

-- Keep only fields required before submission; explanations remain in meta for result pages.
UPDATE `question`
SET `attemptPayload` = JSON_OBJECT(
  'code', JSON_UNQUOTE(JSON_EXTRACT(`meta`, '$.code')),
  'source_examType', JSON_UNQUOTE(JSON_EXTRACT(`meta`, '$.source_examType')),
  'year', JSON_EXTRACT(`meta`, '$.year'),
  'is_ai_generated', JSON_EXTRACT(`meta`, '$.is_ai_generated'),
  'content_blocks', COALESCE(JSON_EXTRACT(`meta`, '$.content_blocks'), JSON_ARRAY()),
  'images', COALESCE(JSON_EXTRACT(`meta`, '$.images'), JSON_ARRAY())
);
