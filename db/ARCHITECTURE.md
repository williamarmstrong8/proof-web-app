# Proof App - Tasks Architecture

Visual reference for the tasks and completions system.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROOF APP FRONTEND                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   HomePage   │    │  TaskList    │    │ AddTaskModal │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                    │               │
│         └───────────────────┴────────────────────┘               │
│                             │                                    │
│                     ┌───────▼────────┐                          │
│                     │ WebsiteContext │◄─── User state from auth  │
│                     │  (useWebsite)  │                          │
│                     └───────┬────────┘                          │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              │              │              │                    │
│         ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐              │
│         │ Tasks   │   │ Create    │  │Complete │              │
│         │ Fetch   │   │ Task      │  │ Task    │              │
│         └────┬────┘   └─────┬─────┘  └────┬────┘              │
│              │              │              │                    │
└──────────────┼──────────────┼──────────────┼────────────────────┘
               │              │              │
               │              │              │
┌──────────────▼──────────────▼──────────────▼────────────────────┐
│                      SUPABASE BACKEND                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DATABASE (PostgreSQL)                 │   │
│  │                                                           │   │
│  │  ┌────────────┐           ┌──────────────────┐          │   │
│  │  │  profiles  │           │      tasks       │          │   │
│  │  │            │           │                  │          │   │
│  │  │ • id (PK)  │◄──────────┤ • id (PK)       │          │   │
│  │  │ • username │  owner_id │ • owner_id (FK) │          │   │
│  │  │ • first_name│          │ • title         │          │   │
│  │  │ • last_name│           │ • description   │          │   │
│  │  │ • avatar   │           │ • created_at    │          │   │
│  │  └────────────┘           └────────┬─────────┘          │   │
│  │                                    │                     │   │
│  │                                    │ task_id             │   │
│  │                                    │                     │   │
│  │  ┌─────────────────────────────────▼─────────────┐     │   │
│  │  │         task_completions                       │     │   │
│  │  │                                                 │     │   │
│  │  │ • id (PK)                                      │     │   │
│  │  │ • task_id (FK) ───────────────────────────────►│     │   │
│  │  │ • user_id (FK) ────────────────────────────────┤     │   │
│  │  │ • completed_on (DATE) ← UNIQUE per task/user   │     │   │
│  │  │ • photo_url                                    │     │   │
│  │  │ • caption                                      │     │   │
│  │  │ • task_title_snapshot                         │     │   │
│  │  │ • created_at                                   │     │   │
│  │  │                                                 │     │   │
│  │  │ CONSTRAINT: UNIQUE(task_id, user_id, completed_on)│  │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              STORAGE (Supabase Storage)                   │  │
│  │                                                            │  │
│  │  task-photos/ (PUBLIC BUCKET)                            │  │
│  │    ├── {user_id_1}/                                       │  │
│  │    │   ├── 1702000000000_abc.jpg ◄── photo_url ref       │  │
│  │    │   └── 1702000001000_def.jpg                         │  │
│  │    ├── {user_id_2}/                                       │  │
│  │    │   └── 1702000002000_ghi.jpg                         │  │
│  │    └── ...                                                │  │
│  │                                                            │  │
│  │  Policies:                                                │  │
│  │   • SELECT: public (anyone can view)                     │  │
│  │   • INSERT: authenticated (logged-in users)              │  │
│  │   • UPDATE/DELETE: owner only (by folder path)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ROW LEVEL SECURITY (RLS)                     │  │
│  │                                                            │  │
│  │  tasks:                                                   │  │
│  │   • SELECT: owner_id = auth.uid()                        │  │
│  │   • INSERT: owner_id = auth.uid()                        │  │
│  │   • UPDATE: owner_id = auth.uid()                        │  │
│  │   • DELETE: owner_id = auth.uid()                        │  │
│  │                                                            │  │
│  │  task_completions:                                        │  │
│  │   • SELECT: true (public - for feeds)                    │  │
│  │   • INSERT: user_id = auth.uid()                         │  │
│  │   • UPDATE: user_id = auth.uid()                         │  │
│  │   • DELETE: user_id = auth.uid()                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Creating a Task

```
User clicks "Add Task" button
         │
         ▼
  AddTaskModal opens
         │
         ▼
User enters "Morning Run"
         │
         ▼
   Click "Add Task"
         │
         ▼
WebsiteContext.createTask()
         │
         ▼
INSERT INTO tasks (owner_id, title)
         │
         ▼
   Task created
         │
         ▼
WebsiteContext.refetchTasks()
         │
         ▼
   UI updates with new task
```

### 2. Completing a Task (with Photo)

```
User clicks unchecked task
         │
         ▼
TaskCompletionModal opens
         │
         ▼
User selects photo + caption
         │
         ▼
   Click "Complete"
         │
         ▼
WebsiteContext.completeTask()
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
Upload to Storage          Generate filename
task-photos/               timestamp_random.jpg
{user_id}/{filename}              │
         │                         │
         ▼                         │
Get public URL ◄──────────────────┘
         │
         ▼
INSERT INTO task_completions
  (task_id, user_id, 
   completed_on = TODAY,
   photo_url, caption)
         │
         ▼
UNIQUE constraint enforces
one completion per day
         │
         ▼
WebsiteContext.refetchTasks()
         │
         ▼
UI shows task as checked ✓
```

### 3. Uncompleting a Task

```
User clicks checked task
         │
         ▼
Confirmation dialog
"Delete your proof?"
         │
         ▼
   User confirms
         │
         ▼
WebsiteContext.uncompleteTask()
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
DELETE FROM              DELETE FROM
task_completions         storage.objects
WHERE id = completion_id WHERE path = photo_path
         │                      │
         └──────────┬───────────┘
                    ▼
      WebsiteContext.refetchTasks()
                    │
                    ▼
         UI shows task unchecked ○
```

### 4. Checking Today's Status (on Page Load)

```
Page loads
    │
    ▼
WebsiteContext.fetchTasks()
    │
    ▼
SELECT tasks.*,
       tc.id AS completion_id,
       tc.photo_url
FROM tasks t
LEFT JOIN task_completions tc
  ON tc.task_id = t.id
  AND tc.user_id = auth.uid()
  AND tc.completed_on = CURRENT_DATE
WHERE t.owner_id = auth.uid()
    │
    ▼
Process results:
- If tc.id exists → completed_today = true
- If tc.id is null → completed_today = false
    │
    ▼
Store in WebsiteContext state
    │
    ▼
Components render with status:
  ✓ Completed
  ○ Not completed
```

---

## 🗄️ Database Relationships

```
profiles (1) ──────► (N) tasks
    │                    │
    │                    │
    │                    ▼
    └────────► (N) task_completions
                    ▲
                    │
               references both
               profiles & tasks
```

**Cascade Rules:**
- Delete user → deletes all their tasks → deletes all completions
- Delete task → deletes all its completions
- Completions always have valid user_id and task_id (enforced by FK)

---

## 🔐 Security Model

```
┌──────────────────────────────────────────────────────┐
│                   USER ACTIONS                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Can I read this task?                               │
│  ├─ YES if I own it (owner_id = my id)              │
│  └─ NO otherwise                                     │
│                                                       │
│  Can I read this completion (post)?                  │
│  └─ YES always (public feed)                         │
│                                                       │
│  Can I create a task?                                │
│  └─ YES if I set owner_id = my id                   │
│                                                       │
│  Can I complete a task?                              │
│  ├─ YES if I own the task                           │
│  ├─ YES if not already completed today              │
│  └─ NO if already completed (UNIQUE constraint)     │
│                                                       │
│  Can I delete a completion?                          │
│  └─ YES if user_id = my id                          │
│                                                       │
│  Can I upload a photo?                               │
│  └─ YES if authenticated                             │
│                                                       │
│  Can I delete a photo?                               │
│  └─ YES if it's in my folder (user_id/)             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Query Patterns

### Daily Status Check

```sql
-- Is this task completed today?
SELECT EXISTS (
  SELECT 1 
  FROM task_completions
  WHERE task_id = ?
    AND user_id = ?
    AND completed_on = CURRENT_DATE
)
```

### Current Streak

```sql
-- How many consecutive days including today?
WITH RECURSIVE streak AS (
  SELECT CURRENT_DATE AS d, 0 AS days
  UNION ALL
  SELECT d - 1, days + 1
  FROM streak
  WHERE EXISTS (
    SELECT 1 FROM task_completions
    WHERE task_id = ? AND user_id = ?
      AND completed_on = d - 1
  )
  AND days < 365
)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM task_completions
      WHERE task_id = ? AND completed_on = CURRENT_DATE
    ) THEN MAX(days) + 1
    ELSE 0
  END
FROM streak
```

### Global Feed

```sql
-- Get recent posts from all users
SELECT 
  tc.*,
  t.title AS task_title,
  p.username, p.first_name, p.avatar_url
FROM task_completions tc
JOIN tasks t ON t.id = tc.task_id
JOIN profiles p ON p.id = tc.user_id
ORDER BY tc.created_at DESC
LIMIT 50
```

---

## 🎯 Key Design Decisions

### Why DATE instead of TIMESTAMP for completed_on?

✅ **Chosen: DATE**
- Simple: One completion per calendar day
- Clear: No timezone confusion
- Enforced: UNIQUE constraint works perfectly
- Streaks: Easy to calculate consecutive dates

❌ **Not chosen: TIMESTAMP**
- Complex: Could complete multiple times per day
- Confusing: What timezone?
- Streaks: Harder to calculate

### Why task_title_snapshot?

✅ **Prevents broken posts**
- User completes "Morning Run"
- Later renames task to "Evening Run"
- Old posts still show "Morning Run" (snapshot)
- Posts make sense historically

❌ **Without snapshot**
- Post caption says "Morning Run"
- Task now called "Evening Run"
- Looks inconsistent/confusing

### Why public SELECT on completions?

✅ **Enables social features**
- Anyone can view the global feed
- Friends can see each other's posts
- No auth needed to browse

✅ **Still secure**
- Can only CREATE/UPDATE/DELETE your own
- Photo URLs are public but not guessable
- RLS prevents unauthorized writes

### Why no soft deletes?

✅ **Simpler**
- Truly delete when done with a task
- No "deleted" flag to check everywhere
- Cleaner queries

❌ **Trade-off**
- Can't restore deleted tasks
- Historical data lost

**Solution**: If you need history, just don't delete! Archive instead.

---

## 📈 Scaling Considerations

### Current Design (Good for)
- ✅ 1-10K users
- ✅ Dozens of tasks per user
- ✅ Daily completions
- ✅ Simple queries

### If You Hit Performance Issues

**1. Materialized Views**
```sql
CREATE MATERIALIZED VIEW user_streaks AS
SELECT 
  user_id, task_id,
  get_current_streak(task_id, user_id) AS streak
FROM tasks;

REFRESH MATERIALIZED VIEW user_streaks;
```

**2. Caching Layer**
- Redis for current streaks
- Cache feed queries (1 min TTL)
- Cache user's task list (invalidate on mutation)

**3. Partition Tables**
```sql
CREATE TABLE task_completions_2025 
  PARTITION OF task_completions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

**4. Denormalize**
- Add `total_completions` to tasks table
- Add `current_streak` to tasks table
- Update via triggers (trade-off: complexity)

---

## 🔍 Monitoring Queries

### Storage Usage
```sql
SELECT 
  COUNT(*) AS total_photos,
  pg_size_pretty(SUM(LENGTH(photo_url))) AS url_storage
FROM task_completions
WHERE photo_url IS NOT NULL;
```

### Active Users
```sql
SELECT 
  COUNT(DISTINCT user_id) AS active_today
FROM task_completions
WHERE completed_on = CURRENT_DATE;
```

### Most Popular Tasks
```sql
SELECT 
  t.title,
  COUNT(*) AS completion_count
FROM task_completions tc
JOIN tasks t ON t.id = tc.task_id
WHERE tc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.title
ORDER BY completion_count DESC
LIMIT 10;
```

### Longest Streaks
```sql
SELECT 
  p.username,
  t.title,
  get_current_streak(t.id, p.id) AS streak
FROM tasks t
JOIN profiles p ON p.id = t.owner_id
WHERE get_current_streak(t.id, p.id) > 0
ORDER BY streak DESC
LIMIT 10;
```

---

## 📚 Related Documentation

- **Setup Instructions**: `../SETUP_TASKS_BACKEND.md`
- **Database Schema**: `20251208_create_tasks_and_completions.sql`
- **Storage Setup**: `storage_setup.md`
- **Streak Queries**: `streak_queries.sql`
- **Full Documentation**: `README.md`

---

**This document provides a visual reference for the architecture. For detailed setup instructions, see the other files in this folder.**

