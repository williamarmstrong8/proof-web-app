-- ============================================
-- ADD STATUS AND INVITEE COLUMNS TO PARTNER_TASKS
-- ============================================
-- Created: 2025-12-09
-- Purpose: Add invite status tracking and invitee tracking to partner tasks
-- 
-- Status values:
-- 'pending' - Invite sent, waiting for partner to accept/decline
-- 'accepted' - Partner accepted, task is active
-- 'declined' - Partner declined the invite
-- 'cancelled' - Creator cancelled the invite
--
-- invitee_profile_id: Stores who the invite is intended for (set when invite is created)
-- partner_profile_id: Set to invitee_profile_id when invite is accepted (was NULL before)
-- ============================================

-- Add invitee_profile_id column (who the invite is FOR)
ALTER TABLE public.partner_tasks
ADD COLUMN IF NOT EXISTS invitee_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add status column to partner_tasks
ALTER TABLE public.partner_tasks
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));

-- Update existing rows to have 'accepted' status (they already have partner_profile_id set)
-- For these, set invitee_profile_id = partner_profile_id (they were created directly)
UPDATE public.partner_tasks
SET status = 'accepted',
    invitee_profile_id = partner_profile_id
WHERE partner_profile_id IS NOT NULL;

-- Update rows with NULL partner_profile_id to 'pending' (these are pending invites)
-- Note: These might not have invitee_profile_id set yet if created before this migration
UPDATE public.partner_tasks
SET status = 'pending'
WHERE partner_profile_id IS NULL;

-- Add index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_partner_tasks_status 
  ON public.partner_tasks(status) 
  WHERE status IN ('pending', 'accepted');

-- Add index for finding invites for a specific user
CREATE INDEX IF NOT EXISTS idx_partner_tasks_invitee 
  ON public.partner_tasks(invitee_profile_id) 
  WHERE status = 'pending';

-- Update the partial unique constraint to include status
-- Only allow one active (accepted) partner task with same title between same pair
DROP INDEX IF EXISTS idx_partner_tasks_unique_active_pair_title;
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_tasks_unique_active_pair_title 
  ON public.partner_tasks (
    LEAST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    GREATEST(creator_profile_id, COALESCE(partner_profile_id, creator_profile_id)),
    title
  ) WHERE status = 'accepted' AND is_active = true;

-- Update RLS policy to allow viewing pending invites
-- Users can view:
-- 1. Tasks where they are creator or partner
-- 2. Pending invites where they are the invitee (invitee_profile_id)
DROP POLICY IF EXISTS "Users can view own partner tasks" ON public.partner_tasks;
CREATE POLICY "Users can view own partner tasks"
  ON public.partner_tasks
  FOR SELECT
  USING (
    auth.uid() = creator_profile_id OR 
    auth.uid() = partner_profile_id OR
    auth.uid() = invitee_profile_id
  );

-- Update comments
COMMENT ON COLUMN public.partner_tasks.status IS 
  'Invite status: pending (waiting), accepted (active), declined, or cancelled';
COMMENT ON COLUMN public.partner_tasks.invitee_profile_id IS 
  'The user who was invited (set when invite is created). When accepted, partner_profile_id = invitee_profile_id';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
