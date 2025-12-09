-- =====================================================
-- Friendships Table Migration
-- =====================================================
-- Creates a friendship system where users can send friend requests,
-- accept them, and manage their friendships.
--
-- Status: "requested" = pending request, "confirmed" = friends
-- =====================================================

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id BIGSERIAL PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can't be friends with themselves
  CONSTRAINT different_users CHECK (requester_id != addressee_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_users ON public.friendships(requester_id, addressee_id);

-- Create unique index to prevent duplicate friendships (works in both directions)
-- This ensures only one friendship row exists between any two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_unique_pair 
ON public.friendships (
  LEAST(requester_id, addressee_id),
  GREATEST(requester_id, addressee_id)
);

-- Enable Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only create friendship rows where they are the requester
CREATE POLICY "Users can create own friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS Policy: Users can view friendships where they are either the requester or addressee
-- This allows users to see:
-- 1. Friend requests they sent (where they are requester_id)
-- 2. Friend requests they received (where they are addressee_id)
-- 3. Confirmed friendships (where they are either requester or addressee)
CREATE POLICY "Users can view own friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = addressee_id
  );

-- RLS Policy: Users can update friendships where they are involved
-- (Typically to accept a request - change status from "requested" to "confirmed")
CREATE POLICY "Users can update own friendships"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policy: Users can delete friendships where they are involved
-- (Unfriend or cancel request)
CREATE POLICY "Users can delete own friendships"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.friendships_id_seq TO authenticated;

-- =====================================================
-- Additional Profile Policies for Friend Discovery
-- =====================================================
-- Allow users to view other users' profiles for friend search
-- (This extends the existing profiles table policies)

-- Policy: Users can view all profiles (needed for friend search)
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Note: The "Users can view own profile" policy from supabase_setup.sql
-- might conflict with this broader policy. If you get errors, you may need to
-- drop the old policy first:
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
