import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number;
  daily_goal: number | null;
  phone: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Section = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Activity = {
  id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  points: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  stock: number | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
};

export type AppSettings = {
  id: number;
  church_name: string;
  tagline: string | null;
  hero_video_url: string | null;
  hero_image_url: string | null;
  login_video_url: string | null;
  login_image_url: string | null;
  primary_color: string;
  updated_at: string;
};

export type Devotional = {
  id: string;
  title: string;
  bible_ref: string | null;
  verse_text: string | null;
  message: string | null;
  reflection_question: string | null;
  display_date: string | null;
  created_at: string;
};

export type PrayerType = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type PrayerRequest = {
  id: string;
  user_id: string;
  prayer_type_id: string | null;
  request_text: string;
  is_anonymous: boolean;
  is_answered: boolean;
  created_at: string;
};

export type DailyTask = {
  id: string;
  task_text: string;
  task_type: 'written' | 'check';
  points: number;
  is_active: boolean;
  created_at: string;
};

export type DailyTaskCompletion = {
  id: string;
  user_id: string;
  task_id: string;
  completion_date: string;
  written_response: string | null;
  created_at: string;
};

export type Outing = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  meeting_date: string;
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
};

export type OutingConfirmation = {
  id: string;
  user_id: string;
  outing_id: string;
  status: string;
  created_at: string;
};

export type Understanding = {
  id: string;
  user_id: string;
  summary: string;
  understanding_date: string;
  points_awarded: number;
  created_at: string;
};

export type BibleStudy = {
  id: string;
  title: string;
  description: string | null;
  bible_ref: string | null;
  content: string | null;
  question: string;
  points: number;
  is_active: boolean;
  created_at: string;
};

export type BibleStudyAnswer = {
  id: string;
  user_id: string;
  study_id: string;
  answer_text: string;
  created_at: string;
};
