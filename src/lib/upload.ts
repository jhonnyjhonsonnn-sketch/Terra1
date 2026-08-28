import { supabase } from '@/lib/supabase';

export async function uploadFile(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${folder}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('media').upload(fileName, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    // Try creating bucket if it doesn't exist yet
    const { error: bucketErr } = await supabase.storage.createBucket('media', { public: true });
    if (bucketErr && !bucketErr.message.includes('already exists')) {
      console.error('Upload error:', error);
      return null;
    }
    const { error: retryErr } = await supabase.storage.from('media').upload(fileName, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (retryErr) {
      console.error('Retry upload error:', retryErr);
      return null;
    }
  }

  const { data } = supabase.storage.from('media').getPublicUrl(fileName);
  return data.publicUrl;
}
