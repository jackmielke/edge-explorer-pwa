-- Update the character-models bucket to allow larger files (200MB for GLB models)
UPDATE storage.buckets 
SET file_size_limit = 209715200 -- 200MB in bytes
WHERE name = 'character-models';