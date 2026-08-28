import { useEffect, useState } from 'react';
import { supabase, type AppSettings } from '@/lib/supabase';

type VideoSource = 'login' | 'app';

export function useVideoSettings(source: VideoSource) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as AppSettings);
    });
  }, []);

  if (source === 'login') {
    return {
      videoUrl: settings?.login_video_url || null,
      imageUrl: settings?.login_image_url || null,
    };
  }
  return {
    videoUrl: settings?.hero_video_url || null,
    imageUrl: settings?.hero_image_url || null,
  };
}

export function VideoBackground({ source, overlayOpacity = 0.85 }: { source: VideoSource; overlayOpacity?: number }) {
  const { videoUrl, imageUrl } = useVideoSettings(source);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-950 to-neutral-950" />
      )}
      <div
        className="absolute inset-0 bg-primary-950"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}
