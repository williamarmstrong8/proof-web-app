-- ============================================
-- PARTNER TASK COMPLETIONS TABLE
-- ============================================
-- Created: 2025-12-09
-- Purpose: Track daily completions for partner tasks
--
-- Each row represents one user completing a partner task on a specific date.
-- Both users must complete the task on the same day for the task to be "fully complete."
-- ============================================

-- ============================================
-- 1. CREATE PARTNER_TASK_COMPLETIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.partner_task_completions (
  id BIGSERIAL PRIMARY KEY,
  
  -- References the shared partner task
  partner_task_id BIGINT NOT NULL REFERENCES public.partner_tasks(id) ON DELETE CASCADE,
  
  -- References the user who completed (must be one of the two partners)
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- The date this completion is for (no time component)
  completion_date DATE NOT NULL,
  
  -- Proof photo URL (required)
  photo_url TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: One completion per user per partner task per day
  CONSTRAINT unique_partner_task_completion_per_day 
    UNIQUE (partner_task_id, profile_id, completion_date)
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_partner_task_completions_partner_task_id 
  ON public.partner_task_completions(partner_task_id);

CREATE INDEX IF NOT EXISTS idx_partner_task_completions_profile_id 
  ON public.partner_task_completions(profile_id);

CREATE INDEX IF NOT EXISTS idx_partner_task_completions_completion_date 
  ON public.partner_task_completions(completion_date DESC);

-- Composite index for efficient lookups by task and date
CREATE INDEX IF NOT EXISTS idx_partner_task_completions_task_date 
  ON public.partner_task_completions(partner_task_id, completion_date DESC);

-- Composite index for efficient lookups by user and date
CREATE INDEX IF NOT EXISTS idx_partner_task_completions_profile_date 
  ON public.partner_task_completions(profile_id, completion_date DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.partner_task_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT completions for partner tasks they are involved in
CREATE POLICY "Users can view partner task completions"
  ON public.partner_task_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_tasks pt
      WHERE pt.id = partner_task_id
        AND (
          pt.creator_profile_id = auth.uid() OR 
          pt.partner_profile_id = auth.uid()
        )
        AND pt.status = 'accepted'
    )
  );

-- Policy: Users can INSERT completions for their own partner tasks
CREATE POLICY "Users can create own partner task completions"
  ON public.partner_task_completions
  FOR INSERT
  WITH CHECK (
    -- Must be completing as themselves
    auth.uid() = profile_id
    AND
    -- Must be one of the two partners on the task and task must be accepted
    EXISTS (
      SELECT 1 FROM public.partner_tasks pt
      WHERE pt.id = partner_task_id
        AND (
          pt.creator_profile_id = auth.uid() OR 
          pt.partner_profile_id = auth.uid()
        )
        AND pt.status = 'accepted'
    )
  );

-- Policy: Users can DELETE their own completions
CREATE POLICY "Users can delete own partner task completions"
  ON public.partner_task_completions
  FOR DELETE
  USING (
    auth.uid() = profile_id
    AND
    EXISTS (
      SELECT 1 FROM public.partner_tasks pt
      WHERE pt.id = partner_task_id
        AND (
          pt.creator_profile_id = auth.uid() OR 
          pt.partner_profile_id = auth.uid()
        )
        AND pt.status = 'accepted'
    )
  );

-- Policy: Users can UPDATE their own completions (e.g., change photo_url)
CREATE POLICY "Users can update own partner task completions"
  ON public.partner_task_completions
  FOR UPDATE
  USING (
    auth.uid() = profile_id
    AND
    EXISTS (
      SELECT 1 FROM public.partner_tasks pt
      WHERE pt.id = partner_task_id
        AND (
          pt.creator_profile_id = auth.uid() OR 
          pt.partner_profile_id = auth.uid()
        )
        AND pt.status = 'accepted'
    )
  )
  WITH CHECK (
    auth.uid() = profile_id
    AND
    EXISTS (
      SELECT 1 FROM public.partner_tasks pt
      WHERE pt.id = partner_task_id
        AND (
          pt.creator_profile_id = auth.uid() OR 
          pt.partner_profile_id = auth.uid()
        )
        AND pt.status = 'accepted'
    )
  );

-- ============================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.partner_task_completions IS 
  'Daily completions for partner tasks. Each row = one user completing on one date.';

COMMENT ON COLUMN public.partner_task_completions.partner_task_id IS 
  'References the shared partner task';

COMMENT ON COLUMN public.partner_task_completions.profile_id IS 
  'User who completed the task (must be one of the two partners)';

COMMENT ON COLUMN public.partner_task_completions.completion_date IS 
  'The calendar date this completion is for (DATE type, no time)';

COMMENT ON COLUMN public.partner_task_completions.photo_url IS 
  'URL to proof photo in Supabase Storage';

-- ============================================
-- 5. EXAMPLE QUERIES
-- ============================================

-- Query: Get all partner tasks for a user with today's completion status
/*
SELECT 
  pt.id,
  pt.title,
  pt.description,
  pt.creator_profile_id,
  pt.partner_profile_id,
  -- Current user's completion status
  CASE 
    WHEN ptc_current.id IS NOT NULL THEN true 
    ELSE false 
  END AS current_user_completed_today,
  ptc_current.photo_url AS current_user_photo_url,
  -- Partner's completion status
  CASE 
    WHEN ptc_partner.id IS NOT NULL THEN true 
    ELSE false 
  END AS partner_completed_today,
  ptc_partner.photo_url AS partner_photo_url
FROM partner_tasks pt
LEFT JOIN partner_task_completions ptc_current 
  ON ptc_current.partner_task_id = pt.id 
  AND ptc_current.profile_id = auth.uid()
  AND ptc_current.completion_date = CURRENT_DATE
LEFT JOIN partner_task_completions ptc_partner 
  ON ptc_partner.partner_task_id = pt.id 
  AND ptc_partner.profile_id = CASE 
    WHEN pt.creator_profile_id = auth.uid() THEN pt.partner_profile_id
    ELSE pt.creator_profile_id
  END
  AND ptc_partner.completion_date = CURRENT_DATE
WHERE pt.is_active = true
  AND (pt.creator_profile_id = auth.uid() OR pt.partner_profile_id = auth.uid())
ORDER BY pt.created_at DESC;
*/

-- ============================================
-- SETUP COMPLETE!
-- ============================================
