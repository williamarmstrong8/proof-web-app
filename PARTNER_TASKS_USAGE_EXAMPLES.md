# Partner Tasks Usage Examples

This document provides practical examples of how to use the partner tasks feature.

## Database Setup

First, run the SQL migrations in Supabase SQL Editor:

1. Run `db/create_partner_tasks.sql`
2. Run `db/create_partner_task_completions.sql`

## Storage Setup

Partner task photos are stored in the same `task-photos` bucket as personal tasks. If you haven't already set up the bucket, create it in Supabase Dashboard > Storage with these policies:

- **Public read access**: Anyone can view photos
- **Authenticated users can upload**: Users can upload their own photos
- **Users can manage their own files**: Based on folder structure

## Example 1: Creating a Partner Task

```typescript
import { createPartnerTaskAndInvite } from '../lib/partnerTasks'

async function handleCreatePartnerTask() {
  const currentUserId = 'user-abc-123'
  const friendId = 'user-def-456'
  
  const { data, error } = await createPartnerTaskAndInvite(
    currentUserId,
    friendId, // Initially NULL for invite flow, or friendId if directly accepting
    'Daily Morning Walk',
    'Walk together for 30 minutes every morning'
  )
  
  if (error) {
    console.error('Failed to create partner task:', error)
    return
  }
  
  console.log('Partner task created:', data)
  // data.id = the partner_task_id
  // data.partner_profile_id will be NULL until friend accepts
}
```

## Example 2: Accepting a Partner Task Invite

```typescript
import { acceptPartnerTaskInvite } from '../lib/partnerTasks'

async function handleAcceptInvite(partnerTaskId: string) {
  const currentUserId = 'user-def-456' // The invitee
  
  const { data, error } = await acceptPartnerTaskInvite(
    currentUserId,
    partnerTaskId
  )
  
  if (error) {
    console.error('Failed to accept invite:', error)
    return
  }
  
  console.log('Invite accepted:', data)
  // data.partner_profile_id is now set to currentUserId
}
```

## Example 3: Completing a Partner Task

```typescript
import { togglePartnerTaskCompletion } from '../lib/partnerTasks'

async function handleCompletePartnerTask(
  partnerTaskId: string,
  photo: File
) {
  const currentUserId = 'user-abc-123'
  const today = new Date().toISOString().split('T')[0] // '2025-12-09'
  
  // First upload photo to storage
  const photoUrl = await uploadPhotoToStorage(photo)
  
  // Then complete the task
  const { completed, error } = await togglePartnerTaskCompletion(
    currentUserId,
    partnerTaskId,
    today,
    photoUrl
  )
  
  if (error) {
    console.error('Failed to complete partner task:', error)
    return
  }
  
  console.log(completed ? 'Task completed!' : 'Task uncompleted!')
}
```

## Example 4: Checking Completion Status

```typescript
import { getPartnerTaskCompletionStatus } from '../lib/partnerTasks'

async function checkTodayStatus(partnerTaskId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await getPartnerTaskCompletionStatus(
    partnerTaskId,
    today
  )
  
  if (error) {
    console.error('Failed to check status:', error)
    return
  }
  
  console.log('Current user completed:', data.currentUserCompleted)
  console.log('Partner completed:', data.partnerCompleted)
  console.log('Both completed:', data.currentUserCompleted && data.partnerCompleted)
}
```

## Example 5: Fetching All Partner Tasks

```typescript
import { getPartnerTasksForProfile } from '../lib/partnerTasks'

async function loadPartnerTasks(profileId: string) {
  const { data, error } = await getPartnerTasksForProfile(profileId)
  
  if (error) {
    console.error('Failed to load partner tasks:', error)
    return
  }
  
  console.log('Partner tasks:', data)
  // data is an array of PartnerTask objects
  
  // Filter to only accepted tasks (where partner_profile_id is set)
  const acceptedTasks = data.filter(task => task.partner_profile_id !== null)
  
  // Filter to only pending invites (where I'm the creator and partner_profile_id is NULL)
  const pendingInvites = data.filter(
    task => task.creator_profile_id === profileId && task.partner_profile_id === null
  )
  
  return { acceptedTasks, pendingInvites }
}
```

## Example 6: Complete UI Flow in a React Component

```typescript
import { useState, useEffect } from 'react'
import {
  getPartnerTasksForProfile,
  getPartnerTaskCompletionStatus,
  togglePartnerTaskCompletion,
  createPartnerTaskAndInvite,
  type PartnerTask,
} from '../lib/partnerTasks'

export function PartnerTasksPage() {
  const [partnerTasks, setPartnerTasks] = useState<PartnerTask[]>([])
  const [loading, setLoading] = useState(true)
  const currentUserId = 'user-abc-123' // Get from auth context
  const today = new Date().toISOString().split('T')[0]
  
  // Load partner tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])
  
  async function loadTasks() {
    setLoading(true)
    const { data, error } = await getPartnerTasksForProfile(currentUserId)
    if (!error && data) {
      setPartnerTasks(data)
    }
    setLoading(false)
  }
  
  // Create new partner task
  async function handleCreate(friendId: string, title: string, description: string) {
    const { error } = await createPartnerTaskAndInvite(
      currentUserId,
      friendId,
      title,
      description
    )
    
    if (error) {
      alert('Failed to create partner task')
      return
    }
    
    await loadTasks() // Refresh list
  }
  
  // Complete/uncomplete a partner task
  async function handleToggle(taskId: string, photoUrl?: string) {
    const { error } = await togglePartnerTaskCompletion(
      currentUserId,
      taskId,
      today,
      photoUrl
    )
    
    if (error) {
      alert('Failed to toggle completion')
      return
    }
    
    await loadTasks() // Refresh list
  }
  
  // Get completion status for display
  async function getStatus(taskId: string) {
    const { data } = await getPartnerTaskCompletionStatus(taskId, today)
    return data
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Partner Tasks</h1>
      
      {partnerTasks.map(task => (
        <PartnerTaskCard
          key={task.id}
          task={task}
          onToggle={(photoUrl) => handleToggle(task.id, photoUrl)}
          getStatus={() => getStatus(task.id)}
        />
      ))}
      
      <button onClick={() => {
        const friendId = prompt('Enter friend ID')
        const title = prompt('Enter task title')
        if (friendId && title) {
          handleCreate(friendId, title, '')
        }
      }}>
        Create Partner Task
      </button>
    </div>
  )
}
```

## Example 7: Invite Flow with Friend Selection

```typescript
import { useState, useEffect } from 'react'
import { getFriends } from '../lib/friendships'
import { createPartnerTaskAndInvite } from '../lib/partnerTasks'

export function CreatePartnerTaskModal() {
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const currentUserId = 'user-abc-123'
  
  useEffect(() => {
    loadFriends()
  }, [])
  
  async function loadFriends() {
    const { data } = await getFriends(currentUserId)
    if (data) {
      setFriends(data)
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedFriend || !title) {
      alert('Please select a friend and enter a task title')
      return
    }
    
    const { error } = await createPartnerTaskAndInvite(
      currentUserId,
      selectedFriend,
      title,
      description
    )
    
    if (error) {
      alert('Failed to create partner task: ' + error.message)
      return
    }
    
    alert('Partner task invite sent!')
    // Close modal or navigate away
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Partner Task</h2>
      
      <label>
        Select Friend:
        <select 
          value={selectedFriend} 
          onChange={e => setSelectedFriend(e.target.value)}
        >
          <option value="">Choose a friend...</option>
          {friends.map(friend => (
            <option key={friend.profile.id} value={friend.profile.id}>
              {friend.profile.first_name} {friend.profile.last_name}
            </option>
          ))}
        </select>
      </label>
      
      <label>
        Task Title:
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="e.g., Daily Morning Walk"
        />
      </label>
      
      <label>
        Description (optional):
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)}
          placeholder="Add details about the task..."
        />
      </label>
      
      <button type="submit">Send Invite</button>
    </form>
  )
}
```

## Example 8: Querying Completion History

```sql
-- Get all completions for a partner task (both users)
SELECT 
  ptc.id,
  ptc.completion_date,
  ptc.photo_url,
  p.first_name,
  p.last_name,
  p.username
FROM partner_task_completions ptc
JOIN profiles p ON p.id = ptc.profile_id
WHERE ptc.partner_task_id = 123
ORDER BY ptc.completion_date DESC;

-- Get streak data for a partner task
SELECT 
  completion_date,
  COUNT(*) as users_completed,
  STRING_AGG(p.first_name, ', ') as completed_by
FROM partner_task_completions ptc
JOIN profiles p ON p.id = ptc.profile_id
WHERE ptc.partner_task_id = 123
GROUP BY completion_date
HAVING COUNT(*) = 2  -- Both users completed
ORDER BY completion_date DESC;

-- Check if both users completed today
SELECT 
  (SELECT COUNT(*) FROM partner_task_completions 
   WHERE partner_task_id = 123 AND completion_date = CURRENT_DATE) = 2 
  AS both_completed_today;
```

## Best Practices

1. **Always check auth state**: Verify the current user is authenticated before calling partner task functions
2. **Upload photos first**: Upload photos to storage before creating completion records
3. **Handle errors gracefully**: All functions return `{ error, data }` - always check for errors
4. **Refresh UI after mutations**: After creating, updating, or deleting, refresh the task list
5. **Validate friend relationships**: Only allow creating partner tasks with confirmed friends
6. **Use date format consistently**: Always use `YYYY-MM-DD` format for dates
7. **Handle NULL partner_profile_id**: Tasks with NULL partner are pending invites

## Common Patterns

### Pattern 1: Show pending vs active tasks
```typescript
const activeTasks = partnerTasks.filter(t => t.partner_profile_id !== null)
const pendingInvites = partnerTasks.filter(
  t => t.creator_profile_id === currentUserId && t.partner_profile_id === null
)
```

### Pattern 2: Get partner's profile
```typescript
const partnerId = task.creator_profile_id === currentUserId 
  ? task.partner_profile_id 
  : task.creator_profile_id

const { data: partner } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', partnerId)
  .single()
```

### Pattern 3: Archive instead of delete
```typescript
// Instead of deleting, set is_active to false
await supabase
  .from('partner_tasks')
  .update({ is_active: false })
  .eq('id', taskId)
```

## Troubleshooting

**Issue**: RLS policy denying insert
- **Solution**: Verify auth.uid() matches the profile_id in the insert

**Issue**: Unique constraint violation
- **Solution**: User already has a completion for this date - use toggle instead of direct insert

**Issue**: Partner completion not showing
- **Solution**: Verify partner_profile_id is set (not NULL) and both users have access to the task

**Issue**: Photo upload fails
- **Solution**: Check storage bucket policies and ensure user is authenticated
