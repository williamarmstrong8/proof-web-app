-- ============================================
-- Allow users to view other users' tasks
-- ============================================
-- This policy allows anyone to view tasks from any user
-- This is needed so that friend profiles can display habits/streaks
-- Users can still only INSERT/UPDATE/DELETE their own tasks

-- Policy: Anyone can view all tasks (for viewing friend profiles)
CREATE POLICY "Anyone can view tasks"
  ON public.tasks
  FOR SELECT
  USING (true);

-- Note: This policy is in addition to the existing "Users can view own tasks" policy
-- PostgreSQL will use OR logic, so users can view both their own tasks AND all other tasks
