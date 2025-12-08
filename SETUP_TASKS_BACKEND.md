# Proof App - Tasks & Completions Backend Setup

This guide walks you through setting up the complete backend for personal daily habits (tasks) and their completions (which also function as posts).

## 🎯 What Was Built

### Database Schema
- ✅ `tasks` table - Personal daily habits for each user
- ✅ `task_completions` table - Daily completions that also act as posts
- ✅ Row Level Security (RLS) policies for both tables
- ✅ Indexes for optimal query performance
- ✅ One completion per day enforcement via UNIQUE constraint

### Frontend Integration
- ✅ Added task management to `WebsiteContext.tsx`
- ✅ Replaced hardcoded habits with database-backed tasks
- ✅ Photo upload support with Supabase Storage
- ✅ Complete/uncomplete task functionality
- ✅ Task creation modal integration

### Helper Queries
- ✅ Streak calculation queries (current streak, longest streak)
- ✅ Feed queries (global posts from task completions)
- ✅ Daily completion status checks

---

## 📁 New Files Created

```
code/
├── db/                                         # NEW FOLDER
│   ├── README.md                               # Database documentation
│   ├── storage_setup.md                        # Storage bucket setup guide
│   ├── 20251208_create_tasks_and_completions.sql  # Main schema file
│   └── streak_queries.sql                      # Streak calculation helpers
├── SETUP_TASKS_BACKEND.md                      # This file
└── src/
    └── lib/
        └── WebsiteContext.tsx                  # UPDATED - Added task management
```

---

## 🚀 Setup Instructions

### Step 1: Run the SQL Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `code/db/20251208_create_tasks_and_completions.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click **Run**

This creates:
- `tasks` table with RLS
- `task_completions` table with RLS  
- Indexes for performance
- Helper triggers for `updated_at`

**Verify it worked:**
```sql
SELECT * FROM tasks LIMIT 1;
SELECT * FROM task_completions LIMIT 1;
```

### Step 2: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `task-photos`
4. Make it **Public** ✅
5. Click **Create**

### Step 3: Add Storage Policies

Follow the detailed instructions in `code/db/storage_setup.md`.

**Quick version:**

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-photos');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-photos');
```

**Policy 3: Users Manage Own Photos**
```sql
CREATE POLICY "Users can manage their own photos"
ON storage.objects FOR UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'task-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Test the Setup

The frontend code is already updated and ready to use!

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Log in to your app

3. Go to the home page

4. Try:
   - ✅ Click "Add New Task" to create a task
   - ✅ Click the checkbox to complete a task (upload a photo)
   - ✅ Click again to uncheck (confirm deletion)

---

## 🔧 How It Works

### Daily Task Flow

#### 1. Creating a Task

```typescript
const { createTask } = useWebsite()
await createTask('Morning Run', 'Run 2 miles')
```

This inserts into `tasks` table:
```sql
INSERT INTO tasks (owner_id, title, description)
VALUES (auth.uid(), 'Morning Run', 'Run 2 miles')
```

#### 2. Completing a Task

User clicks checkbox → Opens photo upload modal → Uploads photo + caption

```typescript
const { completeTask } = useWebsite()
await completeTask(taskId, photoFile, 'Felt great!')
```

This:
1. Uploads photo to `task-photos/{user_id}/{filename}`
2. Inserts into `task_completions`:
   ```sql
   INSERT INTO task_completions (
     task_id, user_id, completed_on, photo_url, caption, task_title_snapshot
   ) VALUES (
     123, auth.uid(), CURRENT_DATE, 'https://...', 'Felt great!', 'Morning Run'
   )
   ```

The UNIQUE constraint ensures only ONE completion per task per day.

#### 3. Uncompleting a Task

User clicks checkbox again → Confirms deletion

```typescript
const { uncompleteTask } = useWebsite()
await uncompleteTask(taskId, completionId)
```

This:
1. Deletes the row from `task_completions`
2. Deletes the photo from storage

### Checking Today's Status

On page load, `WebsiteContext` fetches all tasks with today's completion status:

```typescript
const { tasks } = useWebsite()
// Each task has:
// - completed_today: boolean
// - completion_id: string (if completed)
// - completion_photo_url: string (if completed)
```

The query:
```sql
SELECT 
  t.*,
  tc.id AS completion_id,
  tc.photo_url,
  tc.caption
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
  AND tc.completed_on = CURRENT_DATE
WHERE t.owner_id = auth.uid()
```

---

## 📊 Streak Queries

See `code/db/streak_queries.sql` for advanced queries.

### Quick Streak Check (in SQL)

```sql
-- Current streak for a task
SELECT get_current_streak(task_id, auth.uid());
```

### Adding Streaks to Frontend

The streak functions are already in the SQL file. To use them:

**Option 1: Call RPC from frontend**
```typescript
const { data: streak } = await supabase.rpc('get_current_streak', {
  p_task_id: taskId,
  p_user_id: user.id
})
```

**Option 2: Add to WebsiteContext**
```typescript
// In WebsiteContext.tsx, add to Task interface:
export interface Task {
  // ... existing fields
  current_streak?: number
}

// In fetchTasks, add streak calculation:
const { data: tasksWithStreaks } = await supabase
  .from('tasks')
  .select(`
    *,
    current_streak:get_current_streak(id, owner_id)
  `)
```

---

## 🎨 Frontend Components Updated

### WebsiteContext.tsx

New exports:
- `tasks` - Array of tasks with today's completion status
- `createTask(title, description?)` - Create new task
- `deleteTask(taskId)` - Delete task permanently
- `completeTask(taskId, photo, caption?)` - Complete task for today
- `uncompleteTask(taskId, completionId)` - Uncheck task for today
- `refetchTasks()` - Refresh tasks from database

### HomePage.tsx

- ✅ Removed hardcoded tasks array
- ✅ Now loads tasks from `useWebsite()`
- ✅ Photo upload on complete
- ✅ Confirmation on uncomplete
- ✅ Real-time updates after actions

### TaskList.tsx

- ✅ Integrated with `createTask` from WebsiteContext
- ✅ Shows loading state while creating
- ✅ Supports uncomplete callback

### IndividualTask.tsx

- ✅ Supports complete/uncomplete toggle
- ✅ Passes completion_id for uncomplete

### TaskCompletionModal.tsx

- ✅ Works with File objects (not base64)
- ✅ Shows loading state during upload
- ✅ Prevents closing while submitting

### AddTaskModal.tsx

- ✅ Shows "Creating..." while saving
- ✅ Disables inputs during creation
- ✅ Prevents closing while creating

---

## 🎯 Using the New System

### Basic Usage

```typescript
import { useWebsite } from './lib/WebsiteContext'

function MyComponent() {
  const { tasks, createTask, completeTask, uncompleteTask } = useWebsite()
  
  // Display tasks
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Completed today: {task.completed_today ? '✓' : '○'}</p>
        </div>
      ))}
    </div>
  )
}
```

### Creating a Task

```typescript
const handleCreate = async () => {
  const { error, task } = await createTask('Read for 30 minutes')
  if (error) {
    alert(error.message)
  } else {
    console.log('Created:', task)
  }
}
```

### Completing a Task

```typescript
const handleComplete = async (taskId: string, photo: File) => {
  const { error } = await completeTask(taskId, photo, 'Great session!')
  if (error) {
    alert(error.message)
  }
  // Tasks automatically refresh
}
```

### Uncompleting a Task

```typescript
const handleUncomplete = async (taskId: string, completionId: string) => {
  if (!confirm('Delete your proof photo?')) return
  
  const { error } = await uncompleteTask(taskId, completionId)
  if (error) {
    alert(error.message)
  }
}
```

---

## 📝 Database Schema Reference

### tasks

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigserial | Primary key |
| `owner_id` | uuid | User who owns this task (FK to profiles.id) |
| `title` | text | Task name (e.g., "Morning Run") |
| `description` | text | Optional description |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Constraints:**
- FK: `owner_id` → `profiles.id` ON DELETE CASCADE

**Indexes:**
- `idx_tasks_owner_id` on `owner_id`
- `idx_tasks_created_at` on `created_at DESC`

**RLS:** Enabled - users can only see/modify their own tasks

---

### task_completions

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigserial | Primary key |
| `task_id` | bigint | Task that was completed (FK to tasks.id) |
| `user_id` | uuid | User who completed it (FK to profiles.id) |
| `completed_on` | date | Calendar date of completion |
| `caption` | text | Optional caption (for the post) |
| `photo_url` | text | URL to proof photo in storage |
| `task_title_snapshot` | text | Task title at time of completion |
| `created_at` | timestamptz | When the completion was recorded |
| `updated_at` | timestamptz | Last update |

**Constraints:**
- FK: `task_id` → `tasks.id` ON DELETE CASCADE
- FK: `user_id` → `profiles.id` ON DELETE CASCADE
- UNIQUE: `(task_id, user_id, completed_on)` - One per day!

**Indexes:**
- `idx_task_completions_user_id_completed_on` on `(user_id, completed_on DESC)`
- `idx_task_completions_created_at` on `created_at DESC`
- `idx_task_completions_task_id` on `task_id`
- `idx_task_completions_completed_on` on `completed_on DESC`

**RLS:** Enabled - public read, users can only insert/modify their own

---

## 🔐 Security (RLS Policies)

### tasks policies:
- ✅ Users can SELECT their own tasks
- ✅ Users can INSERT their own tasks
- ✅ Users can UPDATE their own tasks
- ✅ Users can DELETE their own tasks

### task_completions policies:
- ✅ Anyone can SELECT (for public feeds)
- ✅ Users can INSERT their own completions
- ✅ Users can UPDATE their own completions
- ✅ Users can DELETE their own completions

### Storage policies (task-photos bucket):
- ✅ Public can read (view photos)
- ✅ Authenticated users can upload
- ✅ Users can only delete their own photos

---

## 🚨 Common Issues & Solutions

### "Row violates row-level security policy"
**Problem:** Trying to access data without permission.  
**Solution:** Make sure you're authenticated and RLS policies are applied correctly.

### "Duplicate key violation on unique_task_completion_per_day"
**Problem:** Trying to complete a task twice in one day.  
**Solution:** This is expected behavior. Check for existing completion first.

### "Bucket not found"
**Problem:** Storage bucket not created or named incorrectly.  
**Solution:** Create bucket named exactly `task-photos` (lowercase, hyphen).

### Photos not uploading
**Problem:** Storage policies not configured.  
**Solution:** Follow `storage_setup.md` to add all three policies.

### Tasks not loading
**Problem:** RLS policies too restrictive or not applied.  
**Solution:** Run the SQL file again to ensure policies exist.

---

## 🎁 What's Included

### ✅ Core Features (Implemented)
- Personal daily tasks (habits)
- One completion per day enforcement
- Photo proof required for completion
- Optional captions on completions
- Uncomplete/delete completions
- Public feed of completions (posts)
- Task management (create, delete)
- Real-time UI updates

### 📈 Streak Features (Queries Provided)
- Current streak calculation
- Longest streak calculation
- Completion rate percentages
- Weekly completion patterns
- Achievement detection (7, 30, 100 day milestones)
- Leaderboards

### 🚀 Coming Soon (Not Yet Implemented)
- Group tasks / challenges
- Friends feed (filter by friends)
- Likes/comments on posts
- Task categories/tags
- Task templates
- Notifications

---

## 📚 Additional Resources

- **Database Documentation:** `code/db/README.md`
- **Storage Setup Guide:** `code/db/storage_setup.md`
- **Streak Queries:** `code/db/streak_queries.sql`
- **SQL Schema:** `code/db/20251208_create_tasks_and_completions.sql`

---

## ✅ Checklist

Before going live, verify:

- [ ] SQL schema executed successfully
- [ ] `task-photos` storage bucket created
- [ ] All three storage policies applied
- [ ] Can create tasks in the UI
- [ ] Can complete tasks with photo upload
- [ ] Can uncomplete tasks
- [ ] Photos are publicly viewable via URL
- [ ] RLS prevents unauthorized access
- [ ] Tasks persist after page refresh

---

## 🎉 You're Done!

Your Proof app now has a complete backend for daily habits and task completions!

**Next steps:**
1. Run the SQL schema
2. Create the storage bucket
3. Test in your app
4. (Optional) Add streak calculations to UI
5. (Optional) Build the posts feed using `task_completions`

Questions? Check the README files in `code/db/` or review the SQL comments.

