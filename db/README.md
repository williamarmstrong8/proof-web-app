# Proof App Database Schema

This folder contains SQL migration files and database documentation for the Proof app.

## Overview

The Proof app uses Supabase (PostgreSQL) for its backend. The main entities are:

- **profiles** - User profiles (already exists)
- **tasks** - Personal daily habits/tasks for each user
- **task_completions** - Daily task completions that also function as social posts

## Folder Organization

```
db/
├── README.md                                  # This file
├── 20251208_create_tasks_and_completions.sql  # Main schema file
└── storage_setup.md                           # Storage bucket setup guide
```

## Quick Setup

### 1. Run the SQL Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20251208_create_tasks_and_completions.sql`
4. Paste and run it in the SQL Editor

This will create:
- `tasks` table with RLS policies
- `task_completions` table with RLS policies
- Necessary indexes for performance
- Helper triggers for `updated_at` timestamps

### 2. Set Up Storage Bucket

Follow the instructions in `storage_setup.md` to create the `task-photos` bucket with proper policies.

## Database Tables

### tasks

Personal daily habits owned by individual users.

**Columns:**
- `id` (bigserial) - Primary key
- `owner_id` (uuid) - References profiles.id (the user who owns this task)
- `title` (text) - Task name (e.g., "Morning Run")
- `description` (text, nullable) - Optional longer description
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- `idx_tasks_owner_id` on `owner_id`
- `idx_tasks_created_at` on `created_at DESC`

**RLS Policies:**
- Users can view their own tasks
- Users can insert their own tasks
- Users can update their own tasks
- Users can delete their own tasks

### task_completions

Daily completions of tasks - also serve as posts in the social feed.

**Columns:**
- `id` (bigserial) - Primary key
- `task_id` (bigint) - References tasks.id (which task was completed)
- `user_id` (uuid) - References profiles.id (who completed the task)
- `completed_on` (date) - The calendar date this task was completed
- `caption` (text, nullable) - Optional caption/note
- `photo_url` (text, nullable) - URL to the proof photo
- `task_title_snapshot` (text, nullable) - Snapshot of task title at completion time
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Constraints:**
- `UNIQUE (task_id, user_id, completed_on)` - Only one completion per user per task per day

**Indexes:**
- `idx_task_completions_user_id_completed_on` on `(user_id, completed_on DESC)`
- `idx_task_completions_created_at` on `created_at DESC`
- `idx_task_completions_task_id` on `task_id`
- `idx_task_completions_completed_on` on `completed_on DESC`

**RLS Policies:**
- Anyone can view all completions (public posts)
- Users can insert their own completions
- Users can update their own completions
- Users can delete their own completions

## Daily Logic

### Completing a Task

To mark a task as completed for today:

1. Upload photo to `task-photos` storage bucket
2. Insert a row into `task_completions` with:
   - `task_id` - the task being completed
   - `user_id` - current user's ID
   - `completed_on` - CURRENT_DATE
   - `photo_url` - URL to the uploaded photo
   - `caption` - optional caption
   - `task_title_snapshot` - snapshot of the task title

The UNIQUE constraint ensures only one completion per day.

### Uncompleting a Task

To "uncheck" a task for today:

1. Delete the corresponding row from `task_completions`
2. Optionally delete the photo from storage

### Checking Today's Status

To see if a task is completed today:

```sql
SELECT EXISTS (
  SELECT 1
  FROM task_completions
  WHERE task_id = :task_id
    AND user_id = auth.uid()
    AND completed_on = CURRENT_DATE
) AS is_completed_today;
```

## Streak Queries

### Current Streak for a Single Task

See the example query in the SQL file (`Query 2`). It uses a recursive CTE to count consecutive days up to today.

### All Tasks with Recent Completions

```sql
SELECT 
  t.id,
  t.title,
  COUNT(tc.id) FILTER (WHERE tc.completed_on >= CURRENT_DATE - INTERVAL '30 days') AS completions_last_30_days,
  MAX(CASE WHEN tc.completed_on = CURRENT_DATE THEN 1 ELSE 0 END) AS completed_today
FROM tasks t
LEFT JOIN task_completions tc 
  ON tc.task_id = t.id 
  AND tc.user_id = auth.uid()
WHERE t.owner_id = auth.uid()
GROUP BY t.id, t.title
ORDER BY t.created_at DESC;
```

## Feed Queries

### Global Feed (All Posts)

```sql
SELECT 
  tc.id,
  tc.photo_url,
  tc.caption,
  tc.completed_on,
  tc.created_at,
  COALESCE(tc.task_title_snapshot, t.title) AS task_title,
  p.id AS user_id,
  p.username,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM task_completions tc
LEFT JOIN tasks t ON t.id = tc.task_id
INNER JOIN profiles p ON p.id = tc.user_id
ORDER BY tc.created_at DESC
LIMIT 50;
```

### Friends Feed (Coming Soon)

Once you have a `friendships` table, you can filter the global feed query:

```sql
WHERE tc.user_id IN (
  SELECT friend_id FROM friendships WHERE user_id = auth.uid()
)
```

## Frontend Integration

The `WebsiteContext.tsx` provides these functions:

- `tasks` - Array of tasks with today's completion status
- `createTask(title, description?)` - Create a new task
- `deleteTask(taskId)` - Permanently delete a task
- `completeTask(taskId, photo, caption?)` - Complete a task for today (uploads photo)
- `uncompleteTask(taskId, completionId)` - Uncheck a task for today (deletes completion and photo)
- `refetchTasks()` - Manually refresh tasks from database

### Example Usage

```tsx
import { useWebsite } from './lib/WebsiteContext'

function MyComponent() {
  const { tasks, createTask, completeTask } = useWebsite()
  
  // Create a task
  const handleCreate = async () => {
    const { error } = await createTask('Morning Run', 'Run 2 miles')
    if (error) console.error(error)
  }
  
  // Complete a task
  const handleComplete = async (taskId: string, photo: File) => {
    const { error } = await completeTask(taskId, photo, 'Felt great!')
    if (error) console.error(error)
  }
  
  // Display tasks
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          {task.title} - {task.completed_today ? '✓' : '○'}
        </div>
      ))}
    </div>
  )
}
```

## Performance Considerations

1. **Indexes** - All critical query paths are indexed
2. **RLS** - Row Level Security is enabled for data protection
3. **Streaks** - Computed via queries (no stored procedures or triggers needed)
4. **No Crons** - No scheduled jobs needed; everything is query-based

## Future Enhancements

- Add `longest_streak` computed column or view
- Add materialized view for streak calculations if performance becomes an issue
- Add `friendships` table for friend-specific feeds
- Add group tasks / challenges
- Add likes/comments on task_completions (posts)

## Troubleshooting

### "Row level security is enabled but no policies"

Make sure you ran the entire SQL file including the RLS policy sections.

### "Permission denied for table tasks"

Make sure you're authenticated and the RLS policies are correctly applied.

### "Duplicate key violation on unique_task_completion_per_day"

This is expected - it means the task was already completed today. Check for existing completions first.

### Photos not uploading

Make sure:
1. The `task-photos` storage bucket exists
2. Storage policies are configured correctly (see `storage_setup.md`)
3. You're authenticated when uploading

## Migration Strategy

If you already have data:

1. **Backup first!** Export your data before running migrations
2. Run the SQL file in a transaction (it's idempotent with `IF NOT EXISTS`)
3. Test with a non-production Supabase project first
4. Verify RLS policies don't lock you out of existing data

## Support

For issues or questions:
1. Check the SQL comments in `20251208_create_tasks_and_completions.sql`
2. Review the example queries at the bottom of the SQL file
3. Check Supabase logs for detailed error messages
4. Verify your RLS policies with `SELECT * FROM pg_policies;`

