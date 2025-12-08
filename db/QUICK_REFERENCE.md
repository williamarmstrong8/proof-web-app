# Tasks & Completions - Quick Reference

**One-page cheat sheet for developers** 📝

---

## 🚀 Setup (3 Steps)

```bash
# 1. Run SQL
# Copy code/db/20251208_create_tasks_and_completions.sql
# → Paste in Supabase SQL Editor → Run

# 2. Create bucket
# Supabase Dashboard → Storage → New Bucket
# Name: task-photos | Public: Yes

# 3. Add policies (see storage_setup.md)
```

---

## 💻 Frontend API

```typescript
import { useWebsite } from './lib/WebsiteContext'

const { tasks, createTask, completeTask, uncompleteTask } = useWebsite()

// Create
await createTask('Morning Run', 'Run 2 miles')

// Complete (with photo)
await completeTask(taskId, photoFile, 'Felt great!')

// Uncomplete
await uncompleteTask(taskId, completionId)

// Check status
tasks.forEach(task => {
  console.log(task.title, task.completed_today ? '✓' : '○')
})
```

---

## 🗄️ Database Tables

### tasks

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigserial | PK |
| `owner_id` | uuid | FK → profiles.id |
| `title` | text | "Morning Run" |
| `description` | text | Optional |

**RLS**: Users can CRUD their own tasks only

### task_completions

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigserial | PK |
| `task_id` | bigint | FK → tasks.id |
| `user_id` | uuid | FK → profiles.id |
| `completed_on` | date | UNIQUE per task/user/day |
| `photo_url` | text | Public URL |
| `caption` | text | Optional |

**RLS**: Public read, users can write/delete their own

---

## 📊 Common Queries

### Get tasks with today's status

```typescript
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    task_completions!left (
      id,
      photo_url,
      caption,
      completed_on
    )
  `)
  .eq('owner_id', userId)
```

### Check if completed today

```sql
SELECT EXISTS (
  SELECT 1 FROM task_completions
  WHERE task_id = ? 
    AND user_id = ?
    AND completed_on = CURRENT_DATE
)
```

### Current streak

```sql
SELECT get_current_streak(:task_id, auth.uid());
```

### Global feed

```sql
SELECT 
  tc.*, t.title, p.username, p.avatar_url
FROM task_completions tc
JOIN tasks t ON t.id = tc.task_id
JOIN profiles p ON p.id = tc.user_id
ORDER BY tc.created_at DESC
LIMIT 50
```

---

## 📦 Storage

**Bucket**: `task-photos` (public)

**Path**: `{user_id}/{timestamp}_{random}.{ext}`

**Upload**:
```typescript
const path = `${userId}/${Date.now()}_${random()}.jpg`
await supabase.storage
  .from('task-photos')
  .upload(path, file)

const { data } = supabase.storage
  .from('task-photos')
  .getPublicUrl(path)
```

**Policies**:
- SELECT: Public
- INSERT: Authenticated
- UPDATE/DELETE: Owner only

---

## 🔥 Streak Functions

Create in SQL Editor:

```sql
-- Get current streak
CREATE FUNCTION get_current_streak(task_id BIGINT, user_id UUID)
RETURNS INTEGER AS $$
  -- Counts consecutive days up to today
  -- Returns 0 if not completed today
$$ LANGUAGE plpgsql;

-- Get longest streak
CREATE FUNCTION get_longest_streak(task_id BIGINT, user_id UUID)
RETURNS INTEGER AS $$
  -- Returns best streak ever for this task
$$ LANGUAGE plpgsql;
```

See `streak_queries.sql` for full implementation.

---

## ⚡ Quick Tips

**Daily Logic**
- One completion per day = UNIQUE constraint
- No cron needed = queries check `completed_on = CURRENT_DATE`
- Reset daily = no reset! Date-based logic handles it

**Photo Storage**
- Public bucket = anyone can view
- User folders = users can only delete their own
- Compression = optional, use `browser-image-compression`

**Streaks**
- Current = recursive CTE or stored function
- Cache in frontend = refetch only on mutations
- Display = add to UI separately (queries provided)

**Performance**
- Indexes on all FKs
- Composite index on `(user_id, completed_on DESC)`
- Feed index on `created_at DESC`
- Add caching if needed

---

## 🔒 Security

```
tasks:          owner_id = auth.uid()
completions:    user_id = auth.uid() (write)
                true (read - public feed)
storage:        folder path = auth.uid()
```

---

## 🚨 Troubleshooting

| Error | Solution |
|-------|----------|
| "RLS policy violation" | Check auth.uid() matches owner_id |
| "Duplicate key" | Already completed today (expected) |
| "Bucket not found" | Create `task-photos` bucket |
| Photos not loading | Check bucket is public |
| Can't upload | Check storage policies |

---

## 📁 File Structure

```
code/db/
├── README.md                           # Full docs
├── ARCHITECTURE.md                     # Visual diagrams
├── QUICK_REFERENCE.md                  # This file
├── storage_setup.md                    # Storage guide
├── streak_queries.sql                  # Streak examples
└── 20251208_create_tasks_and_completions.sql
```

---

## 📚 Full Documentation

- **Setup Guide**: `../SETUP_TASKS_BACKEND.md`
- **Architecture**: `ARCHITECTURE.md`
- **Database**: `README.md`
- **Storage**: `storage_setup.md`
- **Streaks**: `streak_queries.sql`

---

## ✅ Testing Checklist

```
[ ] SQL schema runs without errors
[ ] Storage bucket created (task-photos)
[ ] Storage policies applied (3 policies)
[ ] Can create task in UI
[ ] Can complete task with photo
[ ] Photo is publicly viewable
[ ] Can uncomplete task
[ ] Tasks persist after refresh
[ ] Can't complete twice in one day
[ ] Other users can't see my tasks
```

---

## 🎯 Example Flow

```typescript
// 1. User loads page
const { tasks } = useWebsite()
// tasks = [{ title: 'Morning Run', completed_today: false }]

// 2. User clicks unchecked task
// → Modal opens

// 3. User uploads photo + caption
const photo = new File([blob], 'run.jpg')
await completeTask(taskId, photo, 'Great run!')

// 4. Backend:
//    - Uploads to storage
//    - Inserts into task_completions
//    - Refetches tasks

// 5. UI updates
// tasks = [{ title: 'Morning Run', completed_today: true ✓ }]
```

---

**Need more details?** See the full documentation in the other files.

**Need help?** Check SETUP_TASKS_BACKEND.md for common issues.

