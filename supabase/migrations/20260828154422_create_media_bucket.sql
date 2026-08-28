/*
# Create media storage bucket for video/image uploads
Creates a public bucket so admin can upload hero videos and images.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to media bucket
DROP POLICY IF EXISTS "media_upload_authenticated" ON storage.objects;
CREATE POLICY "media_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

-- Allow all to read media bucket (public)
DROP POLICY IF EXISTS "media_read_all" ON storage.objects;
CREATE POLICY "media_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated to update/delete their uploads in media
DROP POLICY IF EXISTS "media_update_authenticated" ON storage.objects;
CREATE POLICY "media_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_delete_authenticated" ON storage.objects;
CREATE POLICY "media_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media');
