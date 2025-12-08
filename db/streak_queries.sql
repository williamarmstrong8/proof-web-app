-- ============================================
-- STREAK CALCULATION QUERIES
-- ============================================
-- Practical queries for computing task streaks
-- Copy these into your app or use as reference
-- ============================================

-- ============================================
-- 1. SIMPLE CURRENT STREAK (Basic Approach)
-- ============================================
-- Counts consecutive days including today
-- Returns 0 if not completed today
--
-- NOTE: This query uses placeholders. Replace with actual values:
-- Replace :task_id with a number (e.g., 1)
-- Replace :user_id with a UUID (e.g., auth.uid() or 'your-uuid-here')
--
-- Example usage:
-- Replace :task_id with 1
-- Replace :user_id with auth.uid()

-- FOR TESTING: Replace the placeholders below with actual values
-- WITH RECURSIVE streak_dates AS (
--   SELECT CURRENT_DATE AS check_date, 0 AS days_back
--   UNION ALL
--   SELECT (check_date - INTERVAL '1 day')::DATE, days_back + 1
--   FROM streak_dates
--   WHERE days_back < 365
--     AND EXISTS (
--       SELECT 1 FROM task_completions tc
--       WHERE tc.task_id = 1  -- REPLACE WITH ACTUAL TASK ID
--         AND tc.user_id = auth.uid()  -- OR REPLACE WITH UUID
--         AND tc.completed_on = (check_date - INTERVAL '1 day')::DATE
--     )
-- )
-- SELECT 
--   CASE 
--     WHEN EXISTS (
--       SELECT 1 FROM task_completions 
--       WHERE task_id = 1  -- REPLACE WITH ACTUAL TASK ID
--         AND user_id = auth.uid()  -- OR REPLACE WITH UUID
--         AND completed_on = CURRENT_DATE
--     ) THEN COALESCE(MAX(days_back), 0) + 1
--     ELSE 0
--   END AS current_streak
-- FROM streak_dates;

-- BETTER: Use the function below instead (get_current_streak)


-- ============================================
-- 2. CURRENT STREAK (PostgreSQL Function)
-- ============================================
-- More efficient as a stored function
-- Usage: SELECT get_current_streak(123, 'user-uuid')

CREATE OR REPLACE FUNCTION get_current_streak(
  p_task_id BIGINT,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_completed BOOLEAN;
BEGIN
  -- Loop backwards from today
  LOOP
    -- Check if completed on this date
    SELECT EXISTS (
      SELECT 1 
      FROM task_completions
      WHERE task_id = p_task_id
        AND user_id = p_user_id
        AND completed_on = v_check_date
    ) INTO v_completed;
    
    -- If not completed, break
    IF NOT v_completed THEN
      EXIT;
    END IF;
    
    -- Increment streak and go back one day
    v_streak := v_streak + 1;
    v_check_date := v_check_date - INTERVAL '1 day';
    
    -- Safety limit
    IF v_streak > 1000 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage example:
-- SELECT get_current_streak(123, auth.uid());


-- ============================================
-- 3. ALL TASKS WITH CURRENT STREAKS
-- ============================================
-- Get all tasks for a user with their current streaks
-- This is useful for displaying in the UI

SELECT 
  t.id,
  t.title,
  t.description,
  get_current_streak(t.id, auth.uid()) AS current_streak,
  -- Check if completed today
  EXISTS (
    SELECT 1 
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.user_id = auth.uid()
      AND tc.completed_on = CURRENT_DATE
  ) AS completed_today,
  -- Total completions all-time
  COUNT(tc.id) AS total_completions
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
WHERE t.owner_id = auth.uid()
GROUP BY t.id, t.title, t.description
ORDER BY t.created_at DESC;


-- ============================================
-- 4. LONGEST STREAK (All-time Best)
-- ============================================
-- Calculate the longest streak ever for a task
-- This is more expensive - consider caching the result

CREATE OR REPLACE FUNCTION get_longest_streak(
  p_task_id BIGINT,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_max_streak INTEGER := 0;
  v_current_streak INTEGER := 0;
  v_last_date DATE := NULL;
  v_completion RECORD;
BEGIN
  -- Loop through all completions in chronological order
  FOR v_completion IN (
    SELECT completed_on
    FROM task_completions
    WHERE task_id = p_task_id
      AND user_id = p_user_id
    ORDER BY completed_on ASC
  )
  LOOP
    -- Check if this is consecutive from last date
    IF v_last_date IS NULL OR v_completion.completed_on = v_last_date + INTERVAL '1 day' THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Streak broken - reset
      v_current_streak := 1;
    END IF;
    
    -- Update max if needed
    IF v_current_streak > v_max_streak THEN
      v_max_streak := v_current_streak;
    END IF;
    
    v_last_date := v_completion.completed_on;
  END LOOP;
  
  RETURN v_max_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage example:
-- SELECT get_longest_streak(123, auth.uid());


-- ============================================
-- 5. STREAK BREAKDOWN (Last 30 Days)
-- ============================================
-- Show completion pattern for last 30 days
-- Useful for calendar/heatmap visualizations
--
-- REPLACE task_id and user_id with actual values:
-- Example: Replace :task_id with 1, :user_id with auth.uid()

WITH date_range AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::DATE AS check_date
)
SELECT 
  dr.check_date,
  EXTRACT(DOW FROM dr.check_date) AS day_of_week,  -- 0=Sunday, 6=Saturday
  EXISTS (
    SELECT 1 
    FROM task_completions tc
    WHERE tc.task_id = 1  -- REPLACE WITH ACTUAL TASK ID
      AND tc.user_id = auth.uid()  -- OR REPLACE WITH UUID
      AND tc.completed_on = dr.check_date
  ) AS completed
FROM date_range dr
ORDER BY dr.check_date DESC;


-- ============================================
-- 6. COMPLETION RATE (Percentage)
-- ============================================
-- Calculate what % of days since task creation have been completed
--
-- REPLACE :task_id with actual task ID (e.g., 1)

SELECT 
  t.id,
  t.title,
  t.created_at::DATE AS task_started,
  CURRENT_DATE - t.created_at::DATE + 1 AS total_days,
  COUNT(tc.id) AS completed_days,
  ROUND(
    (COUNT(tc.id)::NUMERIC / NULLIF(CURRENT_DATE - t.created_at::DATE + 1, 0)) * 100,
    1
  ) AS completion_rate_percent
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
WHERE t.id = 1  -- REPLACE WITH ACTUAL TASK ID
  AND t.owner_id = auth.uid()
GROUP BY t.id, t.title, t.created_at;


-- ============================================
-- 7. WEEKLY STREAK PATTERN
-- ============================================
-- See which days of the week you typically complete tasks
-- Useful for insights: "You complete this task most on Mondays"
--
-- REPLACE :task_id and :user_id with actual values

SELECT 
  CASE EXTRACT(DOW FROM tc.completed_on)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END AS day_of_week,
  EXTRACT(DOW FROM tc.completed_on) AS day_number,
  COUNT(*) AS completion_count,
  ROUND(
    (COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER ()) * 100,
    1
  ) AS percentage
FROM task_completions tc
WHERE tc.task_id = 1  -- REPLACE WITH ACTUAL TASK ID
  AND tc.user_id = auth.uid()  -- OR REPLACE WITH UUID
  AND tc.completed_on >= CURRENT_DATE - INTERVAL '90 days'  -- Last 90 days
GROUP BY EXTRACT(DOW FROM tc.completed_on)
ORDER BY day_number;


-- ============================================
-- 8. LEADERBOARD (Top Streakers)
-- ============================================
-- See who has the longest current streaks for any task
-- Great for social/competitive features

SELECT 
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  COALESCE(p.avatar_url, '') AS avatar_url,  -- Handle if column doesn't exist yet
  t.title AS task_title,
  get_current_streak(t.id, p.id) AS current_streak
FROM profiles p
INNER JOIN tasks t ON t.owner_id = p.id
WHERE get_current_streak(t.id, p.id) > 0  -- Only include active streaks
ORDER BY get_current_streak(t.id, p.id) DESC
LIMIT 20;


-- ============================================
-- 9. ACHIEVEMENT DETECTION
-- ============================================
-- Detect when user hits milestone streaks (7, 30, 100, etc.)

WITH user_streaks AS (
  SELECT 
    t.id AS task_id,
    t.title,
    get_current_streak(t.id, auth.uid()) AS current_streak
  FROM tasks t
  WHERE t.owner_id = auth.uid()
)
SELECT 
  task_id,
  title,
  current_streak,
  CASE
    WHEN current_streak >= 365 THEN 'Year Streak! 🏆'
    WHEN current_streak >= 100 THEN '100 Day Streak! 💯'
    WHEN current_streak >= 30 THEN '30 Day Streak! 🔥'
    WHEN current_streak >= 7 THEN 'Week Streak! ⭐'
    ELSE NULL
  END AS achievement,
  CASE
    WHEN current_streak >= 365 THEN NULL
    WHEN current_streak >= 100 THEN 365 - current_streak
    WHEN current_streak >= 30 THEN 100 - current_streak
    WHEN current_streak >= 7 THEN 30 - current_streak
    ELSE 7 - current_streak
  END AS days_to_next_milestone
FROM user_streaks
WHERE current_streak > 0
ORDER BY current_streak DESC;


-- ============================================
-- 10. OPTIMIZED VIEW FOR FRONTEND
-- ============================================
-- Create a materialized view for better performance
-- Refresh this view periodically (e.g., every hour)

CREATE MATERIALIZED VIEW IF NOT EXISTS task_stats AS
SELECT 
  t.id AS task_id,
  t.owner_id AS user_id,
  t.title,
  COUNT(tc.id) AS total_completions,
  MAX(tc.completed_on) AS last_completed_on,
  -- Approximate current streak (will be slightly stale)
  CASE
    WHEN MAX(tc.completed_on) = CURRENT_DATE THEN
      (
        SELECT COUNT(*)
        FROM generate_series(
          CURRENT_DATE - INTERVAL '365 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS d
        WHERE EXISTS (
          SELECT 1 FROM task_completions tc2
          WHERE tc2.task_id = t.id
            AND tc2.user_id = t.owner_id
            AND tc2.completed_on = d::DATE
        )
      )
    ELSE 0
  END AS approx_current_streak
FROM tasks t
LEFT JOIN task_completions tc ON tc.task_id = t.id AND tc.user_id = t.owner_id
GROUP BY t.id, t.owner_id, t.title;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_stats_task_id ON task_stats(task_id);
CREATE INDEX IF NOT EXISTS idx_task_stats_user_id ON task_stats(user_id);

-- Refresh the view (run this periodically, e.g., via cron or edge function)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY task_stats;


-- ============================================
-- USAGE IN YOUR APP
-- ============================================

/*
Frontend TypeScript Example:

interface StreakData {
  current_streak: number
  total_completions: number
  completion_rate_percent: number
}

async function getTaskStreak(taskId: string): Promise<StreakData> {
  const { data, error } = await supabase
    .rpc('get_current_streak', { 
      p_task_id: taskId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id 
    })
  
  if (error) throw error
  return data
}

// Or use the query directly:
const { data } = await supabase
  .from('tasks')
  .select(`
    id,
    title,
    task_completions(count)
  `)
  .eq('owner_id', userId)
*/


-- ============================================
-- PERFORMANCE TIPS
-- ============================================

/*
1. For real-time UI updates:
   - Use simple queries (check if completed today)
   - Compute streaks on-demand or cache in frontend

2. For dashboards/stats:
   - Use stored functions (get_current_streak)
   - Consider materialized views for expensive calculations

3. For large datasets:
   - Add date range filters (last 90 days, etc.)
   - Use pagination for leaderboards
   - Cache results in Redis or similar

4. Indexes already created:
   - (user_id, completed_on DESC) for user completions
   - (task_id) for task lookups
   - (completed_on DESC) for date-based queries
*/


-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- Drop functions
-- DROP FUNCTION IF EXISTS get_current_streak(BIGINT, UUID);
-- DROP FUNCTION IF EXISTS get_longest_streak(BIGINT, UUID);

-- Drop materialized view
-- DROP MATERIALIZED VIEW IF EXISTS task_stats;

