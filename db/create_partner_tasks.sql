-- ============================================
-- PARTNER TASKS TABLE
-- ============================================
-- Created: 2025-12-09
-- Purpose: Shared daily tasks between exactly two users (friends)
-- 
-- A partner task is a shared habit where both users must complete
-- the task each day (with photo) for it to "count."
-- ============================================

-- ============================================
-- 1. CREATE PARTNER_TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.partner_tasks (
  id BIGSERIAL PRIMARY KEY,
  
  -- Creator of the partner task (always set)
  creator_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Partner user (NULL initially while invite is pending, set when accepted)
  partner_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Active status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: creator and partner must be different users
  CONSTRAINT different_partner_users CHECK (
    partner_profile_id IS NULL OR creator_profile_id != partner_profile_id
  )
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_partner_tasks_creator_profile_id 
  ON public.partner_tasks(creator_profile_id);

CREATE INDEX IF NOT EXISTS idx_partner_tasks_partner_profile_id 
  ON public.partner_tasks(partner_profile_id);

CREATE INDEX IF NOT EXISTS idx_partner_tasks_is_active 
  ON public.partner_tasks(is_active) WHERE is_active = true;

-- Composite index for finding active partner tasks for a user
CREATE INDEX IF NOT EXISTS idx_partner_tasks_user_active 
  ON public.partner_tasks(creator_profile_id, partner_profile_id, is_active) 
  WHERE is_active = true;

-- ============================================
-- 3. PARTIAL UNIQUE CONSTRAINT
-- ============================================
-- Prevent multiple active partner tasks with same title between same pair of users

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_tasks_unique_active_pair_title 
  ON public.partner_tasks (
    LEAST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    GREATEST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    title
  ) WHERE is_active = true;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.partner_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT partner tasks where they are either creator or partner
-- Also includes pending invites where they are the creator (partner_profile_id is NULL)
CREATE POLICY "Users can view own partner tasks"
  ON public.partner_tasks
  FOR SELECT
  USING (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

-- Policy: Users can INSERT partner tasks where they are the creator
CREATE POLICY "Users can create partner tasks"
  ON public.partner_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = creator_profile_id);

-- Policy: Users can UPDATE partner tasks where they are involved
-- This allows accepting invites (setting partner_profile_id) or editing task details
-- Note: Application logic should prevent arbitrary reassignment of partner_profile_id
CREATE POLICY "Users can update own partner tasks"
  ON public.partner_tasks
  FOR UPDATE
  USING (auth.uid() = creator_profile_id OR auth.uid() = partner_profile_id)
  WITH CHECK (
    -- User must be either the creator or the partner
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

-- Policy: Users can DELETE partner tasks where they are involved
CREATE POLICY "Users can delete own partner tasks"
  ON public.partner_tasks
  FOR DELETE
  USING (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger for auto-update timestamp
DROP TRIGGER IF EXISTS update_partner_tasks_updated_at ON public.partner_tasks;
CREATE TRIGGER update_partner_tasks_updated_at
  BEFORE UPDATE ON public.partner_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to prevent invalid changes to partner_profile_id
-- Rule: partner_profile_id can only change from NULL to a value (accepting invite)
-- Once set, it cannot be changed or reassigned
CREATE OR REPLACE FUNCTION public.validate_partner_profile_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing creator_profile_id
  IF OLD.creator_profile_id != NEW.creator_profile_id THEN
    RAISE EXCEPTION 'creator_profile_id cannot be changed';
  END IF;
  
  -- Allow setting partner_profile_id from NULL (accepting invite)
  -- Allow keeping partner_profile_id the same
  -- Prevent changing partner_profile_id once it's set
  IF OLD.partner_profile_id IS NOT NULL AND 
     NEW.partner_profile_id IS NOT NULL AND 
     OLD.partner_profile_id != NEW.partner_profile_id THEN
    RAISE EXCEPTION 'partner_profile_id cannot be reassigned once set';
  END IF;
  
  -- Allow setting to NULL (canceling/resetting) - optional, comment out if you don't want this
  -- IF OLD.partner_profile_id IS NOT NULL AND NEW.partner_profile_id IS NULL THEN
  --   RAISE EXCEPTION 'partner_profile_id cannot be set to NULL once assigned';
  -- END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_partner_profile_id_change ON public.partner_tasks;
CREATE TRIGGER validate_partner_profile_id_change
  BEFORE UPDATE ON public.partner_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_partner_profile_id_change();

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.partner_tasks IS 
  'Shared daily tasks between two friends. Both must complete daily for it to count.';

COMMENT ON COLUMN public.partner_tasks.creator_profile_id IS 
  'User who created the partner task (always set)';

COMMENT ON COLUMN public.partner_tasks.partner_profile_id IS 
  'The partner user (NULL while invite pending, set when accepted)';

COMMENT ON COLUMN public.partner_tasks.title IS 
  'Task name (e.g., "Daily Walk", "Cold Plunge")';

COMMENT ON COLUMN public.partner_tasks.description IS 
  'Optional longer description of the shared task';

COMMENT ON COLUMN public.partner_tasks.is_active IS 
  'Whether this partner task is currently active (false = archived)';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
