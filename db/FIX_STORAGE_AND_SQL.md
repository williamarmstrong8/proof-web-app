# Fix Storage Upload Error & SQL Syntax Issues

## 🚨 Problem 1: Photo Upload Fails with "row-level security policy" Error

**Error**: `403 (Bad Request) - new row violates row-level security policy`

**Solution**: Run the storage policies SQL file.

### Quick Fix:

1. **Make sure bucket exists and is PUBLIC:**
   - Go to Supabase Dashboard → Storage
   - Find `task-photos` bucket (or create it if missing)
   - Click on it → Settings
   - Toggle **"Public bucket"** to **ON** ✅

2. **Run the storage policies SQL:**
   - Open `code/db/storage_policies.sql`
   - Copy the entire contents
   - Go to Supabase Dashboard → SQL Editor
   - Paste and click **Run**

3. **Verify policies were created:**
   ```sql
   SELECT * FROM storage.policies 
   WHERE bucket_id = 'task-photos';
   ```
   You should see 4 policies.

4. **Test the upload again** - it should work now!

---

## 🚨 Problem 2: SQL Syntax Error with `:task_id`

**Error**: `syntax error at or near ":" LINE 31: WHERE tc.task_id = :task_id`

**Solution**: The `:task_id` syntax doesn't work in Supabase SQL Editor. Use one of these approaches:

### Option 1: Use the Function (Recommended)

The `get_current_streak()` function is already correct. Use it like this:

```sql
-- Get current streak for a specific task
SELECT get_current_streak(1, auth.uid());
-- Replace 1 with your actual task ID
```

### Option 2: Replace Placeholders with Actual Values

For queries in `streak_queries.sql`, replace `:task_id` and `:user_id` with actual values:

**Before (doesn't work):**
```sql
WHERE tc.task_id = :task_id
  AND tc.user_id = :user_id
```

**After (works):**
```sql
WHERE tc.task_id = 1  -- Replace with actual task ID
  AND tc.user_id = auth.uid()  -- Or replace with UUID string
```

### Option 3: Use RPC Functions (Best for Frontend)

Create RPC functions that accept parameters:

```sql
-- Create a function that accepts task_id as parameter
CREATE OR REPLACE FUNCTION get_task_streak(p_task_id BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN get_current_streak(p_task_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then call from frontend:
-- supabase.rpc('get_task_streak', { p_task_id: 1 })
```

---

## ✅ Step-by-Step Fix

### 1. Fix Storage Upload (Do This First!)

```bash
# 1. Open code/db/storage_policies.sql
# 2. Copy all contents
# 3. Paste in Supabase SQL Editor
# 4. Click Run
# 5. Verify bucket is public (Storage > task-photos > Settings)
```

### 2. Fix SQL Queries (Optional - Only if you need streaks)

**For now, you don't need to run streak queries!** The main functionality (creating tasks, completing tasks) works without them.

**If you want streaks later:**

1. **First, create the function** (this one works):
   ```sql
   -- This is already in streak_queries.sql, just run this part:
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
     LOOP
       SELECT EXISTS (
         SELECT 1 FROM task_completions
         WHERE task_id = p_task_id
           AND user_id = p_user_id
           AND completed_on = v_check_date
       ) INTO v_completed;
       
       IF NOT v_completed THEN
         EXIT;
       END IF;
       
       v_streak := v_streak + 1;
       v_check_date := v_check_date - INTERVAL '1 day';
       
       IF v_streak > 1000 THEN
         EXIT;
       END IF;
     END LOOP;
     
     RETURN v_streak;
   END;
   $$ LANGUAGE plpgsql STABLE;
   ```

2. **Then use it:**
   ```sql
   -- Get streak for task ID 1
   SELECT get_current_streak(1, auth.uid());
   ```

---

## 🧪 Test After Fix

### Test Storage Upload:

1. Go to your app
2. Try to complete a task with a photo
3. Should work now! ✅

### Test Streak Function (if you created it):

```sql
-- Get all your tasks with their streaks
SELECT 
  t.id,
  t.title,
  get_current_streak(t.id, auth.uid()) AS current_streak
FROM tasks t
WHERE t.owner_id = auth.uid();
```

---

## 📝 Summary

**Priority 1 (Required):**
- ✅ Run `storage_policies.sql` to fix photo uploads

**Priority 2 (Optional):**
- ⏳ Streak queries can wait - not needed for basic functionality
- ⏳ When ready, use the `get_current_streak()` function instead of queries with `:task_id`

---

## 🔍 Still Having Issues?

### Storage still not working?

1. **Check bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'task-photos';
   ```

2. **Check bucket is public:**
   - Storage Dashboard → task-photos → Settings → "Public bucket" = ON

3. **Check policies exist:**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE schemaname = 'storage' 
     AND tablename = 'objects'
     AND policyname LIKE '%task-photos%';
   ```

4. **Try deleting and recreating policies:**
   ```sql
   -- Delete all task-photos policies
   DROP POLICY IF EXISTS "Public read access" ON storage.objects;
   DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
   DROP POLICY IF EXISTS "Users can manage their own photos" ON storage.objects;
   DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
   
   -- Then run storage_policies.sql again
   ```

### SQL still giving errors?

- Don't use `:task_id` syntax in Supabase SQL Editor
- Use actual values or functions instead
- For now, skip streak queries - they're optional!

---

**The main fix is running `storage_policies.sql` - that will fix your photo upload issue!** 🎯

