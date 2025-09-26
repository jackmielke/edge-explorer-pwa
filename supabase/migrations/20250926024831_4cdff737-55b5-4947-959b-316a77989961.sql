-- Ensure character-models bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-models', 'character-models', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Public read access for character models" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own character models" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own character models" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own character models" ON storage.objects;

-- Create storage policy for public read access to character models
CREATE POLICY "Public read access for character models"
ON storage.objects
FOR SELECT
USING (bucket_id = 'character-models');

-- Allow authenticated users to upload their own character models
CREATE POLICY "Users can upload their own character models"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'character-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own character models
CREATE POLICY "Users can update their own character models"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'character-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own character models
CREATE POLICY "Users can delete their own character models"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'character-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);