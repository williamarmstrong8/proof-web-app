-- ============================================
-- ADD avatar_url COLUMN TO profiles TABLE
-- ============================================
-- This migration adds the avatar_url column to the profiles table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN avatar_url TEXT;
    
    RAISE NOTICE 'Added avatar_url column to profiles table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in profiles table';
  END IF;
END $$;

-- Add caption column if it doesn't exist (in case it's missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'caption'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN caption TEXT;
    
    RAISE NOTICE 'Added caption column to profiles table';
  ELSE
    RAISE NOTICE 'caption column already exists in profiles table';
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('avatar_url', 'caption')
ORDER BY column_name;

-- ============================================
-- DONE!
-- ============================================
-- The avatar_url and caption columns are now available
-- You can use them in your queries and frontend code
-- ============================================
