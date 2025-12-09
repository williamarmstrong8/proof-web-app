-- Add caption column to profiles table
-- This allows users to have a bio/caption that can be null

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS caption TEXT;

-- The column is already nullable by default, so no additional constraints needed
-- Existing profiles will have NULL caption values, which is allowed

