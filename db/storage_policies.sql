-- ============================================
-- STORAGE POLICIES FOR task-photos BUCKET
-- ============================================
-- Run this AFTER creating the task-photos bucket
-- This fixes the "row-level security policy" error
-- ============================================

-- First, make sure the bucket exists and is public
-- (Do this in Supabase Dashboard > Storage > New Bucket)
-- Name: task-photos
-- Public: Yes

-- ============================================
-- Policy 1: Public Read Access
-- ============================================
-- Anyone can view photos (needed for public feeds)

-- Drop if exists, then create
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'task-photos'::text);

-- ============================================
-- Policy 2: Authenticated Users Can Upload
-- ============================================
-- Logged-in users can upload photos

-- Drop if exists, then create
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'::text 
  AND auth.role() = 'authenticated'::text
);

-- ============================================
-- Policy 3: Users Can Manage Their Own Photos
-- ============================================
-- Users can update/delete only their own photos
-- Based on folder path: {user_id}/{filename}

-- Drop if exists, then create
DROP POLICY IF EXISTS "Users can manage their own photos" ON storage.objects;

CREATE POLICY "Users can manage their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-photos'::text 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'task-photos'::text 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Drop if exists, then create
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'::text 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- VERIFY POLICIES
-- ============================================
-- Run this to check your policies:

-- SELECT * FROM storage.policies WHERE bucket_id = 'task-photos';

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If you still get RLS errors:

-- 1. Make sure bucket is PUBLIC:
--    - Go to Storage > task-photos > Settings
--    - Toggle "Public bucket" to ON

-- 2. Check that policies are enabled:
--    SELECT policyname, cmd, qual, with_check 
--    FROM pg_policies 
--    WHERE schemaname = 'storage' 
--      AND tablename = 'objects'
--      AND policyname LIKE '%task-photos%';

-- 3. If policies exist but don't work, try:
--    DROP POLICY IF EXISTS "Public read access" ON storage.objects;
--    DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can manage their own photos" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
--    Then run this file again.

