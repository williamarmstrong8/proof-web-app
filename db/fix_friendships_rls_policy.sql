-- =====================================================
-- Fix Friendships RLS Policy
-- =====================================================
-- This script ensures users can view friendships where they are
-- either the requester OR the addressee (so they can see incoming requests)
-- =====================================================

-- Drop the existing policy if it exists (in case it was created incorrectly)
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;

-- Create the correct policy that allows users to see friendships
-- where they are involved in either direction
CREATE POLICY "Users can view own friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = addressee_id
  );

-- Verify the policy was created
-- You can check this in Supabase Dashboard → Authentication → Policies

-- =====================================================
-- Additional Debug: Test Query
-- =====================================================
-- Run this query in Supabase SQL Editor while logged in as a user
-- to verify they can see their friendships:
--
-- SELECT * FROM friendships 
-- WHERE requester_id = auth.uid() OR addressee_id = auth.uid();
--
-- This should return all friendships for the current user
-- =====================================================
