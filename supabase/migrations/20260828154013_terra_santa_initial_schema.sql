/*
# Terra Santa - Initial Schema

## Overview
Church youth engagement app with gamification (ranking + rewards), challenges/activities,
and an admin panel for managing everything. Auth-based (sign-in required).

## New Tables
1. `profiles` - extends auth.users with display name, avatar, admin flag, total points
2. `sections` - top-level category headers (cabeçalhos) the admin creates and manages
3. `activities` - challenges/tasks within sections that users complete for points
4. `completions` - record of a user completing an activity (drives the ranking)
5. `rewards` - prizes that users can claim with accumulated points
6. `claims` - record of a user claiming a reward
7. `app_settings` - global settings (video background URL, church name, etc.)

## Security
- RLS enabled on all tables
- profiles: users read all profiles (for ranking), update only own
- sections, activities, rewards, app_settings: all authenticated can read (public content)
- completions: users read all (ranking), insert only own, no update/delete
- claims: users read own, insert own; admin reads all
- Admin actions (create/update/delete sections, activities, rewards, settings, manage users)
  go through SECURITY DEFINER functions that check the is_admin flag, so the browser
  never needs the service role key.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- SECTIONS (cabeçalhos)
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sections_select_authenticated" ON sections;
CREATE POLICY "sections_select_authenticated" ON sections FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- ACTIVITIES (challenges / tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 10 CHECK (points >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_authenticated" ON activities;
CREATE POLICY "activities_select_authenticated" ON activities FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- COMPLETIONS (user completes an activity)
-- ============================================================
CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completions_select_all" ON completions;
CREATE POLICY "completions_select_all" ON completions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "completions_insert_own" ON completions;
CREATE POLICY "completions_insert_own" ON completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points_required integer NOT NULL DEFAULT 100 CHECK (points_required >= 0),
  stock integer, -- null = unlimited
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards_select_authenticated" ON rewards;
CREATE POLICY "rewards_select_authenticated" ON rewards FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- CLAIMS (user claims a reward)
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "claims_select_own" ON claims;
CREATE POLICY "claims_select_own" ON claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "claims_insert_own" ON claims;
CREATE POLICY "claims_insert_own" ON claims FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- APP SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  church_name text NOT NULL DEFAULT 'Terra Santa',
  tagline text,
  hero_video_url text,
  hero_image_url text,
  primary_color text NOT NULL DEFAULT '#1a5631',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_authenticated" ON app_settings;
CREATE POLICY "settings_select_authenticated" ON app_settings FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- ADMIN HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = uid), false);
$$;

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: update total_points on completion insert
-- ============================================================
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET total_points = total_points + (SELECT points FROM activities WHERE id = NEW.activity_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_completion_created ON completions;
CREATE TRIGGER on_completion_created
  AFTER INSERT ON completions
  FOR EACH ROW EXECUTE FUNCTION update_total_points();

-- ============================================================
-- SECURITY DEFINER: Admin-only mutations
-- These let the browser (anon key) perform admin operations safely.
-- The function checks is_admin(auth.uid()) before acting.
-- ============================================================

-- Helper: assert caller is admin
CREATE OR REPLACE FUNCTION assert_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;
END;
$$;

-- Sections CRUD (admin)
CREATE OR REPLACE FUNCTION admin_upsert_section(
  p_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_sort_order integer DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE sections SET title=p_title, description=p_description, icon=p_icon,
      sort_order=p_sort_order, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO sections (title, description, icon, sort_order, is_active)
    VALUES (p_title, p_description, p_icon, p_sort_order, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_section(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM sections WHERE id = p_id;
END;
$$;

-- Activities CRUD (admin)
CREATE OR REPLACE FUNCTION admin_upsert_activity(
  p_id uuid,
  p_section_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_points integer DEFAULT 10,
  p_sort_order integer DEFAULT 0,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE activities SET section_id=p_section_id, title=p_title, description=p_description,
      points=p_points, sort_order=p_sort_order, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO activities (section_id, title, description, points, sort_order, is_active)
    VALUES (p_section_id, p_title, p_description, p_points, p_sort_order, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_activity(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM activities WHERE id = p_id;
END;
$$;

-- Rewards CRUD (admin)
CREATE OR REPLACE FUNCTION admin_upsert_reward(
  p_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_points_required integer DEFAULT 100,
  p_stock integer DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_id uuid;
BEGIN
  PERFORM assert_admin();
  IF p_id IS NOT NULL THEN
    UPDATE rewards SET title=p_title, description=p_description, points_required=p_points_required,
      stock=p_stock, is_active=p_is_active
    WHERE id = p_id RETURNING id INTO out_id;
  ELSE
    INSERT INTO rewards (title, description, points_required, stock, is_active)
    VALUES (p_title, p_description, p_points_required, p_stock, p_is_active)
    RETURNING id INTO out_id;
  END IF;
  RETURN out_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_reward(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  DELETE FROM rewards WHERE id = p_id;
END;
$$;

-- Settings update (admin)
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_church_name text DEFAULT NULL,
  p_tagline text DEFAULT NULL,
  p_hero_video_url text DEFAULT NULL,
  p_hero_image_url text DEFAULT NULL,
  p_primary_color text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  UPDATE app_settings SET
    church_name = COALESCE(p_church_name, church_name),
    tagline = COALESCE(p_tagline, tagline),
    hero_video_url = COALESCE(p_hero_video_url, hero_video_url),
    hero_image_url = COALESCE(p_hero_image_url, hero_image_url),
    primary_color = COALESCE(p_primary_color, primary_color),
    updated_at = now()
  WHERE id = 1;
END;
$$;

-- Toggle admin status (admin only)
CREATE OR REPLACE FUNCTION admin_set_user_admin(p_user_id uuid, p_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  UPDATE profiles SET is_admin = p_is_admin WHERE id = p_user_id;
END;
$$;

-- Claim a reward (check points + stock atomically)
CREATE OR REPLACE FUNCTION claim_reward(p_reward_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_points integer;
  user_points integer;
  current_stock integer;
  out_id uuid;
BEGIN
  SELECT points_required, stock INTO req_points, current_stock FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not available';
  END IF;
  SELECT total_points INTO user_points FROM profiles WHERE id = auth.uid();
  IF user_points IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF user_points < req_points THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;
  IF current_stock IS NOT NULL AND current_stock <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;
  INSERT INTO claims (user_id, reward_id) VALUES (auth.uid(), p_reward_id) RETURNING id INTO out_id;
  -- Deduct points
  UPDATE profiles SET total_points = total_points - req_points WHERE id = auth.uid();
  -- Decrement stock if tracked
  IF current_stock IS NOT NULL THEN
    UPDATE rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;
  RETURN out_id;
END;
$$;

-- Admin: list all claims
CREATE OR REPLACE FUNCTION admin_list_claims()
RETURNS TABLE (id uuid, user_id uuid, reward_id uuid, status text, created_at timestamptz, full_name text, reward_title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  RETURN QUERY
    SELECT c.id, c.user_id, c.reward_id, c.status, c.created_at,
           p.full_name, r.title
    FROM claims c
    JOIN profiles p ON p.id = c.user_id
    JOIN rewards r ON r.id = c.reward_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Admin: update claim status
CREATE OR REPLACE FUNCTION admin_update_claim_status(p_claim_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_admin();
  UPDATE claims SET status = p_status WHERE id = p_claim_id;
END;
$$;

-- Seed default settings row
INSERT INTO app_settings (id, church_name, tagline, hero_image_url, primary_color)
VALUES (1, 'Terra Santa', 'Aproximando jovens de Deus', NULL, '#1a5631')
ON CONFLICT (id) DO NOTHING;

-- Seed a default section + activities so the app isn't empty
INSERT INTO sections (title, description, icon, sort_order)
SELECT 'Vida Espiritual', 'Atividades para fortalecer sua vida com Deus', 'BookOpen', 0
WHERE NOT EXISTS (SELECT 1 FROM sections);

INSERT INTO sections (title, description, icon, sort_order)
SELECT 'Comunidade', 'Compromisso com o conjunto da igreja', 'Users', 1
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE title = 'Comunidade');

INSERT INTO activities (section_id, title, description, points, sort_order)
SELECT s.id, 'Ler a Bíblia por 15 minutos', 'Dedique tempo diário à Palavra', 10, 0
FROM sections s WHERE s.title = 'Vida Espiritual'
AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Ler a Bíblia por 15 minutos');

INSERT INTO activities (section_id, title, description, points, sort_order)
SELECT s.id, 'Orar antes de dormir', 'Converse com Deus ao final do dia', 10, 1
FROM sections s WHERE s.title = 'Vida Espiritual'
AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Orar antes de dormir');

INSERT INTO activities (section_id, title, description, points, sort_order)
SELECT s.id, 'Participar do culto de jovens', 'Esteja presente no encontro', 20, 0
FROM sections s WHERE s.title = 'Comunidade'
AND NOT EXISTS (SELECT 1 FROM activities WHERE title = 'Participar do culto de jovens');

-- Seed a default reward
INSERT INTO rewards (title, description, points_required, stock, is_active)
SELECT 'Camiseta Terra Santa', 'Camiseta exclusiva da igreja', 200, 10, true
WHERE NOT EXISTS (SELECT 1 FROM rewards);
