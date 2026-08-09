-- NormalizeData
UPDATE `examrecord`
SET `practiceSnapshot` = JSON_SET(`practiceSnapshot`, '$.difficulty', 'hard')
WHERE JSON_UNQUOTE(JSON_EXTRACT(`practiceSnapshot`, '$.difficulty')) = 'composite';
