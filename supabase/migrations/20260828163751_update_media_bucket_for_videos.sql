-- Update media bucket to allow video files with larger size limits
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 104857600  -- 100MB for video uploads
WHERE id = 'media';

-- Drop and recreate storage policies to allow video MIME types
DROP POLICY IF EXISTS "media_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "media_read_public" ON storage.objects;
DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "media_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

-- Public read access
CREATE POLICY "media_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'media');

-- Allow users to update their own files
CREATE POLICY "media_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY "media_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());
