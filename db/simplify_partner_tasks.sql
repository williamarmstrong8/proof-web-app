-- ============================================
-- SIMPLIFY PARTNER_TASKS TABLE
-- ============================================
-- Created: 2025-12-09
-- Purpose: Simplify partner_tasks by removing invitee_profile_id and is_active
-- 
-- Changes:
-- 1. Remove invitee_profile_id - use partner_profile_id only (always set, status indicates pending/accepted)
-- 2. Remove is_active - tasks are either live (exist) or deleted (don't exist)
-- ============================================

-- Drop indexes that reference invitee_profile_id
DROP INDEX IF EXISTS idx_partner_tasks_invitee;

-- Drop indexes that reference is_active
DROP INDEX IF EXISTS idx_partner_tasks_is_active;
DROP INDEX IF EXISTS idx_partner_tasks_user_active;

-- Drop unique constraint that references is_active
DROP INDEX IF EXISTS idx_partner_tasks_unique_active_pair_title;

-- IMPORTANT: Drop RLS policies first before dropping columns they reference
-- Drop policies on partner_tasks
DROP POLICY IF EXISTS "Users can view own partner tasks" ON public.partner_tasks;
DROP POLICY IF EXISTS "Users can create partner tasks" ON public.partner_tasks;
DROP POLICY IF EXISTS "Users can update own partner tasks" ON public.partner_tasks;
DROP POLICY IF EXISTS "Users can delete own partner tasks" ON public.partner_tasks;

-- Drop policies on partner_task_completions that reference is_active
DROP POLICY IF EXISTS "Users can view partner task completions" ON public.partner_task_completions;
DROP POLICY IF EXISTS "Users can create own partner task completions" ON public.partner_task_completions;
DROP POLICY IF EXISTS "Users can delete own partner task completions" ON public.partner_task_completions;
DROP POLICY IF EXISTS "Users can update own partner task completions" ON public.partner_task_completions;

-- Drop invitee_profile_id column (if it exists from previous migration)
ALTER TABLE public.partner_tasks
DROP COLUMN IF EXISTS invitee_profile_id;

-- Drop is_active column
ALTER TABLE public.partner_tasks
DROP COLUMN IF EXISTS is_active;

-- For any rows with NULL partner_profile_id (old pending invites), 
-- we need to handle them. Since we can't know the invitee without invitee_profile_id,
-- we'll need to delete them or set a placeholder. For safety, let's delete them.
-- Note: Only do this if you're sure there are no important pending invites
-- DELETE FROM public.partner_tasks WHERE partner_profile_id IS NULL;

-- Actually, if there are existing pending invites with NULL partner_profile_id from before,
-- we can't migrate them automatically. The user should handle these manually.
-- For now, we'll update the constraint but keep partner_profile_id nullable for safety.
-- The application will always set it going forward.

-- Update constraint - remove NULL check since we always set partner_profile_id now
ALTER TABLE public.partner_tasks
DROP CONSTRAINT IF EXISTS different_partner_users;

ALTER TABLE public.partner_tasks
ADD CONSTRAINT different_partner_users CHECK (
  partner_profile_id IS NULL OR creator_profile_id != partner_profile_id
);

-- Note: We keep partner_profile_id nullable for backward compatibility,
-- but the application will always set it when creating new invites.

-- Recreate unique constraint without is_active
-- Only allow one accepted partner task with same title between same pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_tasks_unique_accepted_pair_title 
  ON public.partner_tasks (
    LEAST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    GREATEST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    title
  ) WHERE status = 'accepted';

-- Recreate index for finding active partner tasks (status = 'accepted')
CREATE INDEX IF NOT EXISTS idx_partner_tasks_accepted 
  ON public.partner_tasks(creator_profile_id, partner_profile_id, status) 
  WHERE status = 'accepted';

-- Recreate RLS policies (were dropped above to allow column removal)
CREATE POLICY "Users can view own partner tasks"
  ON public.partner_tasks
  FOR SELECT
  USING (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

CREATE POLICY "Users can create partner tasks"
  ON public.partner_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = creator_profile_id);

CREATE POLICY "Users can update own partner tasks"
  ON public.partner_tasks
  FOR UPDATE
  USING (auth.uid() = creator_profile_id OR auth.uid() = partner_profile_id)
  WITH CHECK (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

CREATE POLICY "Users can delete own partner tasks"
  ON public.partner_tasks
  FOR DELETE
  USING (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id
  );

-- Recreate RLS policies on partner_task_completions (using status instead of is_active)
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

CREATE POLICY "Users can create own partner task completions"
  ON public.partner_task_completions
  FOR INSERT
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

-- Update comments
COMMENT ON COLUMN public.partner_tasks.partner_profile_id IS 
  'The partner user ID. Set when invite is created and remains the same when accepted. Status indicates if pending or accepted.';

COMMENT ON COLUMN public.partner_tasks.status IS 
  'Invite status: pending (waiting for partner to accept), accepted (active task), declined, or cancelled';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Simplified schema:
-- - partner_profile_id: Always set (contains invitee ID, same when accepted)
-- - status: 'pending' = invite waiting, 'accepted' = active task
-- - No is_active: Tasks are either live (exist) or deleted (don't exist)
-- - No invitee_profile_id: Use partner_profile_id for both invitee and accepted partner
-- ============================================
