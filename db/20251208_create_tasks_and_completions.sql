-- ============================================
-- PROOF APP: TASKS & TASK_COMPLETIONS SCHEMA
-- ============================================
-- Created: 2025-12-08
-- Purpose: Personal daily habits (tasks) and their completions (which also act as posts)
--
-- Usage: Copy/paste this entire file into Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TASKS TABLE
-- ============================================
-- Represents personal recurring daily habits for each user

CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.tasks IS 'Personal daily habits/tasks owned by individual users';
COMMENT ON COLUMN public.tasks.owner_id IS 'References profiles.id - the user who owns this task';
COMMENT ON COLUMN public.tasks.title IS 'Task name/title (e.g., "Morning Run", "Read 10 pages")';
COMMENT ON COLUMN public.tasks.description IS 'Optional longer description of the task';


-- ============================================
-- 2. CREATE TASK_COMPLETIONS TABLE
-- ============================================
-- Represents daily completions of tasks - also functions as "posts"
-- Each completion is proof that a user completed a task on a specific date

CREATE TABLE IF NOT EXISTS public.task_completions (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  caption TEXT,
  photo_url TEXT,
  task_title_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Enforce ONE completion per user per task per day
  CONSTRAINT unique_task_completion_per_day UNIQUE (task_id, user_id, completed_on)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id_completed_on ON public.task_completions(user_id, completed_on DESC);
CREATE INDEX IF NOT EXISTS idx_task_completions_created_at ON public.task_completions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_on ON public.task_completions(completed_on DESC);

-- Add comments for documentation
COMMENT ON TABLE public.task_completions IS 'Daily task completions - also serve as posts in the social feed';
COMMENT ON COLUMN public.task_completions.task_id IS 'References tasks.id - which task was completed';
COMMENT ON COLUMN public.task_completions.user_id IS 'References profiles.id - who completed the task (should equal task owner for personal tasks)';
COMMENT ON COLUMN public.task_completions.completed_on IS 'The calendar date this task was completed (used for streaks and daily logic)';
COMMENT ON COLUMN public.task_completions.photo_url IS 'URL to the proof photo (stored in Supabase Storage)';
COMMENT ON COLUMN public.task_completions.caption IS 'Optional caption/note about the completion';
COMMENT ON COLUMN public.task_completions.task_title_snapshot IS 'Snapshot of task title at completion time (prevents broken posts if task is renamed/deleted)';


-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) - TASKS
-- ============================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = owner_id);


-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) - TASK_COMPLETIONS
-- ============================================

-- Enable RLS on task_completions table
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all completions (public posts)
CREATE POLICY "Anyone can view completions"
  ON public.task_completions
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own completions
CREATE POLICY "Users can insert own completions"
  ON public.task_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own completions
CREATE POLICY "Users can update own completions"
  ON public.task_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own completions
CREATE POLICY "Users can delete own completions"
  ON public.task_completions
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 5. HELPER FUNCTION: Auto-update updated_at
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for task_completions table
DROP TRIGGER IF EXISTS update_task_completions_updated_at ON public.task_completions;
CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- 6. EXAMPLE QUERIES FOR COMMON OPERATIONS
-- ============================================

-- --------------------------------------------
-- Query 1: Get all tasks for current user with today's completion status
-- --------------------------------------------
-- This query shows all user's tasks and whether each is completed today
-- Use CURRENT_DATE or pass in a specific date

/*
SELECT 
  t.id,
  t.title,
  t.description,
  t.created_at,
  CASE 
    WHEN tc.id IS NOT NULL THEN true 
    ELSE false 
  END AS completed_today,
  tc.id AS completion_id,
  tc.photo_url,
  tc.caption
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
  AND tc.completed_on = CURRENT_DATE
WHERE t.owner_id = auth.uid()
ORDER BY t.created_at DESC;
*/


-- --------------------------------------------
-- Query 2: Get current streak for a single task
-- --------------------------------------------
-- Computes how many consecutive days (up to and including today) a task was completed
-- Returns 0 if not completed today

/*
WITH RECURSIVE streak_dates AS (
  -- Start with today
  SELECT 
    CURRENT_DATE AS check_date,
    0 AS days_back
  
  UNION ALL
  
  -- Go back one day at a time
  SELECT 
    check_date - INTERVAL '1 day',
    days_back + 1
  FROM streak_dates
  WHERE days_back < 365  -- Limit to prevent infinite recursion
    AND EXISTS (
      SELECT 1 
      FROM task_completions tc
      WHERE tc.task_id = :task_id
        AND tc.user_id = :user_id
        AND tc.completed_on = check_date - INTERVAL '1 day'
    )
)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM task_completions 
      WHERE task_id = :task_id 
        AND user_id = :user_id 
        AND completed_on = CURRENT_DATE
    ) THEN COALESCE(MAX(days_back), 0) + 1
    ELSE 0
  END AS current_streak
FROM streak_dates;
*/


-- --------------------------------------------
-- Query 3: Get all tasks with current streaks for current user
-- --------------------------------------------
-- This is a simplified approach that counts consecutive completions
-- For production, you may want to create a materialized view or function

/*
SELECT 
  t.id,
  t.title,
  -- Count completions in last 30 days as a simple metric
  COUNT(tc.id) FILTER (WHERE tc.completed_on >= CURRENT_DATE - INTERVAL '30 days') AS completions_last_30_days,
  -- Check if completed today
  MAX(CASE WHEN tc.completed_on = CURRENT_DATE THEN 1 ELSE 0 END) AS completed_today
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
WHERE t.owner_id = auth.uid()
GROUP BY t.id, t.title
ORDER BY t.created_at DESC;
*/


-- --------------------------------------------
-- Query 4: Global feed - all posts (completions) with user info
-- --------------------------------------------
-- Returns recent task completions from all users with profile information

/*
SELECT 
  tc.id,
  tc.photo_url,
  tc.caption,
  tc.completed_on,
  tc.created_at,
  -- Task info (use snapshot if available, otherwise join to tasks)
  COALESCE(tc.task_title_snapshot, t.title) AS task_title,
  t.description AS task_description,
  -- User/profile info
  p.id AS user_id,
  p.username,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM task_completions tc
LEFT JOIN tasks t ON t.id = tc.task_id
INNER JOIN profiles p ON p.id = tc.user_id
ORDER BY tc.created_at DESC
LIMIT 50;
*/


-- --------------------------------------------
-- Query 5: Check if task is completed today (for a specific task)
-- --------------------------------------------
-- Simple check to see if a task has been completed today

/*
SELECT EXISTS (
  SELECT 1
  FROM task_completions
  WHERE task_id = :task_id
    AND user_id = auth.uid()
    AND completed_on = CURRENT_DATE
) AS is_completed_today;
*/


-- --------------------------------------------
-- Query 6: Get completion history for a task (for streak calculation in app)
-- --------------------------------------------
-- Returns all completion dates for a task, ordered by date descending

/*
SELECT 
  completed_on,
  photo_url,
  caption,
  created_at
FROM task_completions
WHERE task_id = :task_id
  AND user_id = :user_id
ORDER BY completed_on DESC
LIMIT 100;
*/


-- ============================================
-- 7. STORAGE SETUP INSTRUCTIONS
-- ============================================

-- You need to create a storage bucket for task photos:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named: "task-photos"
-- 3. Make it PUBLIC (so photos can be viewed in feeds)
-- 4. Set up the following policies:
--
-- Policy 1: Anyone can view photos (public read)
--   Operation: SELECT
--   Policy: Allow public access
--   SQL: (bucket_id = 'task-photos')
--
-- Policy 2: Authenticated users can upload photos
--   Operation: INSERT
--   Policy: Users can upload their own photos
--   SQL: (bucket_id = 'task-photos' AND auth.role() = 'authenticated')
--
-- Policy 3: Users can update/delete their own photos
--   Operation: UPDATE, DELETE
--   Policy: Users can manage their own files
--   SQL: (bucket_id = 'task-photos' AND auth.uid()::text = (storage.foldername(name))[1])
--
-- File path structure: task-photos/{user_id}/{timestamp}_{filename}
-- Example: task-photos/abc-123-def/1702000000000_morning_run.jpg


-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create the "task-photos" storage bucket with policies
-- 3. Update your frontend code to use these tables
-- ============================================

