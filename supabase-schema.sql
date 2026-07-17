-- ============================================================
-- PROFOLIO Internship Tracker — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles table — stores user info and role
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'sales_executive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Submissions table — stores daily submissions per user/role/day
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'sales_executive')),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  date_field TEXT DEFAULT '',
  group_name TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  user_role TEXT DEFAULT '',
  task_assigned TEXT DEFAULT '',
  task_completed TEXT DEFAULT '',
  proof_of_work TEXT DEFAULT '',
  challenges_faced TEXT DEFAULT '',
  learning_outcome TEXT DEFAULT '',
  submitted_on TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  task_progress JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, day_number)
);

-- 3. Notes table — stores personal notes per user/role
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'sales_executive')),
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Internship start times per user/role
CREATE TABLE IF NOT EXISTS internship_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'sales_executive')),
  start_time BIGINT NOT NULL,
  UNIQUE(user_id, role)
);

-- ============================================================
-- ROW LEVEL SECURITY — Users can only access their own data
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_timers ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Submissions
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions"
  ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions"
  ON submissions FOR UPDATE USING (auth.uid() = user_id);

-- Notes
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);

-- Internship Timers
CREATE POLICY "Users can view own timers"
  ON internship_timers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timers"
  ON internship_timers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timers"
  ON internship_timers FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
