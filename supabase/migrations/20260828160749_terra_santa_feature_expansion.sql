/*
# Terra Santa - Major Feature Expansion

## Overview
Adds 7 new features: daily devotionals, prayer wall, daily tasks (30 rotating biblical tasks),
outings with WhatsApp confirmations, understanding of the day, bible studies with questions,
and user profile with avatar + daily goal. Also adds login screen video background and
first-account-becomes-admin logic.

## New Tables
1. devotionals - daily devotional content (admin-managed)
2. prayer_types - categories of prayer (admin-managed)
3. prayer_requests - user prayer requests
4. daily_tasks - pool of 30+ biblical daily tasks (admin-managed)
5. daily_task_completions - record of user completing a daily task
6. outings - church outings with WhatsApp confirmation
7. outing_confirmations - user confirms attendance
8. understandings - daily reflection, worth points
9. bible_studies - study content with questions (admin-managed)
10. bible_study_answers - user answers

## Modified Tables
- profiles: added daily_goal, phone, updated_at
- app_settings: added login_video_url, login_image_url
- rewards: added image_url

## Security
- All new tables have RLS enabled
- Public content tables: SELECT to authenticated
- User-data tables: SELECT all (community), INSERT only own
- Admin mutations via SECURITY DEFINER functions
- First user becomes admin automatically
*/

-- ============================================================
-- FIRST USER BECOMES ADMIN (update trigger function)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  SELECT count(*) INTO user_count FROM profiles;
  IF user_count = 1 THEN
    UPDATE profiles SET is_admin = true WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- ADD COLUMNS TO PROFILES
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'daily_goal') THEN
    ALTER TABLE profiles ADD COLUMN daily_goal integer DEFAULT 1;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- ADD COLUMNS TO APP_SETTINGS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'login_video_url') THEN
    ALTER TABLE app_settings ADD COLUMN login_video_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'login_image_url') THEN
    ALTER TABLE app_settings ADD COLUMN login_image_url text;
  END IF;
END $$;

-- ============================================================
-- ADD IMAGE_URL TO REWARDS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'image_url') THEN
    ALTER TABLE rewards ADD COLUMN image_url text;
  END IF;
END $$;

-- ============================================================
-- DEVOTIONALS
-- ============================================================
CREATE TABLE IF NOT EXISTS devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  bible_ref text,
  verse_text text,
  message text,
  reflection_question text,
  display_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devotionals_select_authenticated" ON devotionals;
CREATE POLICY "devotionals_select_authenticated" ON devotionals FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- PRAYER TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prayer_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prayer_types_select_authenticated" ON prayer_types;
CREATE POLICY "prayer_types_select_authenticated" ON prayer_types FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- PRAYER REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_type_id uuid REFERENCES prayer_types(id) ON DELETE SET NULL,
  request_text text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_answered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prayer_requests_select_all" ON prayer_requests;
CREATE POLICY "prayer_requests_select_all" ON prayer_requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "prayer_requests_insert_own" ON prayer_requests;
CREATE POLICY "prayer_requests_insert_own" ON prayer_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prayer_requests_update_own" ON prayer_requests;
CREATE POLICY "prayer_requests_update_own" ON prayer_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prayer_requests_delete_own" ON prayer_requests;
CREATE POLICY "prayer_requests_delete_own" ON prayer_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- DAILY TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_text text NOT NULL,
  task_type text NOT NULL DEFAULT 'written' CHECK (task_type IN ('written','check')),
  points integer NOT NULL DEFAULT 5 CHECK (points >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_tasks_select_authenticated" ON daily_tasks;
CREATE POLICY "daily_tasks_select_authenticated" ON daily_tasks FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- DAILY TASK COMPLETIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  written_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, completion_date)
);

ALTER TABLE daily_task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_task_completions_select_all" ON daily_task_completions;
CREATE POLICY "daily_task_completions_select_all" ON daily_task_completions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_task_completions_insert_own" ON daily_task_completions;
CREATE POLICY "daily_task_completions_insert_own" ON daily_task_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- OUTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS outings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  meeting_date timestamptz NOT NULL,
  whatsapp_number text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outings_select_authenticated" ON outings;
CREATE POLICY "outings_select_authenticated" ON outings FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- OUTING CONFIRMATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS outing_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  outing_id uuid NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, outing_id)
);

ALTER TABLE outing_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outing_confirmations_select_all" ON outing_confirmations;
CREATE POLICY "outing_confirmations_select_all" ON outing_confirmations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "outing_confirmations_insert_own" ON outing_confirmations;
CREATE POLICY "outing_confirmations_insert_own" ON outing_confirmations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UNDERSTANDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS understandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  understanding_date date NOT NULL DEFAULT CURRENT_DATE,
  points_awarded integer NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, understanding_date)
);

ALTER TABLE understandings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "understandings_select_all" ON understandings;
CREATE POLICY "understandings_select_all" ON understandings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "understandings_insert_own" ON understandings;
CREATE POLICY "understandings_insert_own" ON understandings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BIBLE STUDIES
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  bible_ref text,
  content text,
  question text NOT NULL,
  points integer NOT NULL DEFAULT 20 CHECK (points >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bible_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bible_studies_select_authenticated" ON bible_studies;
CREATE POLICY "bible_studies_select_authenticated" ON bible_studies FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- BIBLE STUDY ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_study_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES bible_studies(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_id)
);

ALTER TABLE bible_study_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bible_study_answers_select_all" ON bible_study_answers;
CREATE POLICY "bible_study_answers_select_all" ON bible_study_answers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bible_study_answers_insert_own" ON bible_study_answers;
CREATE POLICY "bible_study_answers_insert_own" ON bible_study_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_completions_user ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_completions_user_date ON daily_task_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_understandings_user_date ON understandings(user_id, understanding_date);
CREATE INDEX IF NOT EXISTS idx_bible_study_answers_user ON bible_study_answers(user_id);

-- ============================================================
-- TRIGGERS: update total_points
-- ============================================================
CREATE OR REPLACE FUNCTION update_points_on_daily_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET total_points = total_points + (SELECT points FROM daily_tasks WHERE id = NEW.task_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_daily_task_completion_created ON daily_task_completions;
CREATE TRIGGER on_daily_task_completion_created
  AFTER INSERT ON daily_task_completions
  FOR EACH ROW EXECUTE FUNCTION update_points_on_daily_task();

CREATE OR REPLACE FUNCTION update_points_on_understanding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET total_points = total_points + NEW.points_awarded
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_understanding_created ON understandings;
CREATE TRIGGER on_understanding_created
  AFTER INSERT ON understandings
  FOR EACH ROW EXECUTE FUNCTION update_points_on_understanding();

CREATE OR REPLACE FUNCTION update_points_on_bible_study()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET total_points = total_points + (SELECT points FROM bible_studies WHERE id = NEW.study_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_bible_study_answer_created ON bible_study_answers;
CREATE TRIGGER on_bible_study_answer_created
  AFTER INSERT ON bible_study_answers
  FOR EACH ROW EXECUTE FUNCTION update_points_on_bible_study();

-- ============================================================
-- ADMIN FUNCTIONS: DEVOTIONALS
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_devotional(
  p_id uuid DEFAULT NULL, p_title text DEFAULT NULL, p_bible_ref text DEFAULT NULL,
  p_verse_text text DEFAULT NULL, p_message text DEFAULT NULL,
  p_reflection_question text DEFAULT NULL, p_display_date date DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE devotionals SET title=p_title, bible_ref=p_bible_ref, verse_text=p_verse_text,
      message=p_message, reflection_question=p_reflection_question, display_date=p_display_date
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO devotionals (title, bible_ref, verse_text, message, reflection_question, display_date)
    VALUES (p_title, p_bible_ref, p_verse_text, p_message, p_reflection_question, p_display_date)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_devotional(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM devotionals WHERE id = p_id;
END;
$$;

-- ============================================================
-- ADMIN FUNCTIONS: PRAYER TYPES
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_prayer_type(
  p_id uuid DEFAULT NULL, p_name text DEFAULT NULL, p_description text DEFAULT NULL,
  p_icon text DEFAULT NULL, p_sort_order integer DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE prayer_types SET name=p_name, description=p_description, icon=p_icon,
      sort_order=p_sort_order, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO prayer_types (name, description, icon, sort_order, is_active)
    VALUES (p_name, p_description, p_icon, p_sort_order, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_prayer_type(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM prayer_types WHERE id = p_id;
END;
$$;

-- ============================================================
-- ADMIN FUNCTIONS: DAILY TASKS
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_daily_task(
  p_id uuid DEFAULT NULL, p_task_text text DEFAULT NULL, p_task_type text DEFAULT 'written',
  p_points integer DEFAULT 5, p_is_active boolean DEFAULT true
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE daily_tasks SET task_text=p_task_text, task_type=p_task_type, points=p_points, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO daily_tasks (task_text, task_type, points, is_active)
    VALUES (p_task_text, p_task_type, p_points, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_daily_task(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM daily_tasks WHERE id = p_id;
END;
$$;

-- ============================================================
-- ADMIN FUNCTIONS: OUTINGS
-- all params have defaults to satisfy Postgres ordering rule
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_outing(
  p_id uuid DEFAULT NULL, p_title text DEFAULT NULL, p_description text DEFAULT NULL,
  p_location text DEFAULT NULL, p_meeting_date timestamptz DEFAULT NULL,
  p_whatsapp_number text DEFAULT NULL, p_is_active boolean DEFAULT true
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE outings SET title=p_title, description=p_description, location=p_location,
      meeting_date=p_meeting_date, whatsapp_number=p_whatsapp_number, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO outings (title, description, location, meeting_date, whatsapp_number, is_active)
    VALUES (p_title, p_description, p_location, p_meeting_date, p_whatsapp_number, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_outing(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM outings WHERE id = p_id;
END;
$$;

-- ============================================================
-- ADMIN FUNCTIONS: BIBLE STUDIES
-- all params have defaults to satisfy Postgres ordering rule
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_bible_study(
  p_id uuid DEFAULT NULL, p_title text DEFAULT NULL, p_description text DEFAULT NULL,
  p_bible_ref text DEFAULT NULL, p_content text DEFAULT NULL,
  p_question text DEFAULT NULL, p_points integer DEFAULT 20, p_is_active boolean DEFAULT true
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE bible_studies SET title=p_title, description=p_description, bible_ref=p_bible_ref,
      content=p_content, question=p_question, points=p_points, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO bible_studies (title, description, bible_ref, content, question, points, is_active)
    VALUES (p_title, p_description, p_bible_ref, p_content, p_question, p_points, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_bible_study(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM bible_studies WHERE id = p_id;
END;
$$;

-- ============================================================
-- ADMIN: VIEW USER DETAIL
-- ============================================================
CREATE OR REPLACE FUNCTION admin_get_user_detail(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid, full_name text, avatar_url text, is_admin boolean,
  total_points integer, daily_goal integer, phone text,
  created_at timestamptz, email text,
  completions_count bigint, understandings_count bigint,
  bible_studies_count bigint, daily_tasks_count bigint,
  prayer_requests_count bigint, claims_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  RETURN QUERY
    SELECT
      p.id, p.full_name, p.avatar_url, p.is_admin,
      p.total_points, p.daily_goal, p.phone, p.created_at,
      au.email,
      (SELECT count(*) FROM completions WHERE user_id = p.id),
      (SELECT count(*) FROM understandings WHERE user_id = p.id),
      (SELECT count(*) FROM bible_study_answers WHERE user_id = p.id),
      (SELECT count(*) FROM daily_task_completions WHERE user_id = p.id),
      (SELECT count(*) FROM prayer_requests WHERE user_id = p.id),
      (SELECT count(*) FROM claims WHERE user_id = p.id)
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE p.id = p_user_id;
END;
$$;

-- ============================================================
-- UPDATE admin_update_settings (with login video)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_church_name text DEFAULT NULL,
  p_tagline text DEFAULT NULL,
  p_hero_video_url text DEFAULT NULL,
  p_hero_image_url text DEFAULT NULL,
  p_primary_color text DEFAULT NULL,
  p_login_video_url text DEFAULT NULL,
  p_login_image_url text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  UPDATE app_settings SET
    church_name = COALESCE(p_church_name, church_name),
    tagline = COALESCE(p_tagline, tagline),
    hero_video_url = COALESCE(p_hero_video_url, hero_video_url),
    hero_image_url = COALESCE(p_hero_image_url, hero_image_url),
    primary_color = COALESCE(p_primary_color, primary_color),
    login_video_url = COALESCE(p_login_video_url, login_video_url),
    login_image_url = COALESCE(p_login_image_url, login_image_url),
    updated_at = now()
  WHERE id = 1;
END;
$$;

-- ============================================================
-- UPDATE admin_upsert_reward (with image_url)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_upsert_reward(
  p_id uuid DEFAULT NULL, p_title text DEFAULT NULL, p_description text DEFAULT NULL,
  p_points_required integer DEFAULT 100, p_stock integer DEFAULT NULL,
  p_is_active boolean DEFAULT true, p_image_url text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE rewards SET title=p_title, description=p_description, points_required=p_points_required,
      stock=p_stock, is_active=p_is_active, image_url=COALESCE(p_image_url, image_url)
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO rewards (title, description, points_required, stock, is_active, image_url)
    VALUES (p_title, p_description, p_points_required, p_stock, p_is_active, p_image_url)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

-- ============================================================
-- SEED: PRAYER TYPES
-- ============================================================
INSERT INTO prayer_types (name, description, icon, sort_order)
SELECT 'Gratidão', 'Agradecer a Deus por suas bênçãos', 'Heart', 0
WHERE NOT EXISTS (SELECT 1 FROM prayer_types);

INSERT INTO prayer_types (name, description, icon, sort_order)
SELECT 'Súplica', 'Pedir a Deus por uma necessidade', 'HandHeart', 1
WHERE NOT EXISTS (SELECT 1 FROM prayer_types WHERE name = 'Súplica');

INSERT INTO prayer_types (name, description, icon, sort_order)
SELECT 'Intercessão', 'Orar por outras pessoas', 'Users', 2
WHERE NOT EXISTS (SELECT 1 FROM prayer_types WHERE name = 'Intercessão');

INSERT INTO prayer_types (name, description, icon, sort_order)
SELECT 'Perdão', 'Pedir perdão a Deus', 'RefreshCw', 3
WHERE NOT EXISTS (SELECT 1 FROM prayer_types WHERE name = 'Perdão');

-- ============================================================
-- SEED: DAILY TASKS (30 biblical tasks)
-- ============================================================
INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler um capítulo da Bíblia e anotar o que mais te tocou', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks);

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar por 5 minutos agradecendo a Deus pelo dia', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar por 5 minutos agradecendo a Deus pelo dia');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Enviar uma mensagem encorajadora para um irmão da igreja', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Enviar uma mensagem encorajadora para um irmão da igreja');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Memorizar um versículo e escrevê-lo de cabeça', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Memorizar um versículo e escrevê-lo de cabeça');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ajudar alguém hoje e descrever o que fez', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ajudar alguém hoje e descrever o que fez');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ouvir um louvor e refletir sobre a letra', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ouvir um louvor e refletir sobre a letra');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Fazer uma oração pela sua família', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Fazer uma oração pela sua família');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler o Salmo 23 e escrever o que ele significa para você', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler o Salmo 23 e escrever o que ele significa para você');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Perdoar alguém hoje e escrever sobre a experiência', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Perdoar alguém hoje e escrever sobre a experiência');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar por um amigo que ainda não conhece a Deus', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar por um amigo que ainda não conhece a Deus');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Escrever 3 coisas pelas quais você é grato hoje', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Escrever 3 coisas pelas quais você é grato hoje');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler Provérbios 3:5-6 e aplicar no seu dia', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler Provérbios 3:5-6 e aplicar no seu dia');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Conversar com Deus por 10 minutos antes de dormir', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Conversar com Deus por 10 minutos antes de dormir');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Escrever uma carta para Deus sobre seus sentimentos', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Escrever uma carta para Deus sobre seus sentimentos');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ajudar em casa sem ser pedido e descrever o que fez', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ajudar em casa sem ser pedido e descrever o que fez');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler a história de Daniel na cova dos leões (Daniel 6)', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler a história de Daniel na cova dos leões (Daniel 6)');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar pela liderança da igreja', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar pela liderança da igreja');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Escrever sobre como Deus te ajudou esta semana', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Escrever sobre como Deus te ajudou esta semana');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Compartilhar um versículo nas redes sociais', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Compartilhar um versículo nas redes sociais');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler Mateus 5 (Bem-aventuranças) e escolher uma para viver hoje', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler Mateus 5 (Bem-aventuranças) e escolher uma para viver hoje');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar por alguém que te magoou', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar por alguém que te magoou');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Fazer um jejum de redes sociais por 2 horas e orar', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Fazer um jejum de redes sociais por 2 horas e orar');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler Filipenses 4:13 e escrever como você pode aplicar', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler Filipenses 4:13 e escrever como você pode aplicar');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Visitar ou ligar para alguém que está doente', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Visitar ou ligar para alguém que está doente');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Escrever um salmo de gratidão', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Escrever um salmo de gratidão');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar pelos jovens da igreja', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar pelos jovens da igreja');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler a parábola do semeador (Marcos 4) e refletir', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler a parábola do semeador (Marcos 4) e refletir');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Escrever sobre um milagre que Deus fez na sua vida', 'written', 10
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Escrever sobre um milagre que Deus fez na sua vida');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Convidar alguém para o culto de jovens', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Convidar alguém para o culto de jovens');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Ler João 3:16 e escrever o que significa para você', 'written', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Ler João 3:16 e escrever o que significa para você');

INSERT INTO daily_tasks (task_text, task_type, points)
SELECT 'Orar em favor da sua cidade e país', 'check', 5
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_text = 'Orar em favor da sua cidade e país');

-- ============================================================
-- SEED: DEVOTIONAL FOR TODAY
-- ============================================================
INSERT INTO devotionals (title, bible_ref, verse_text, message, reflection_question, display_date)
SELECT
  'O amor de Deus é incondicional',
  'Romanos 8:38-39',
  'Porque estou convencido de que nem morte nem vida, nem anjos nem demônios, nem o presente nem o futuro, nem quaisquer poderes, nem altura nem profundidade, nem qualquer outra coisa na criação será capaz de nos separar do amor de Deus que está em Cristo Jesus, nosso Senhor.',
  'O amor de Deus não depende do que fazemos. Ele nos ama quando estamos bem e quando caímos. Não há nada neste mundo que possa nos separar desse amor. Hoje, descanso nessa verdade.',
  'O que te faz duvidar do amor de Deus? Como essa passagem pode mudar sua perspectiva?',
  CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM devotionals);
