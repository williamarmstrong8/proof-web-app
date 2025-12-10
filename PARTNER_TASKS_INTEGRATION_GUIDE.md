# Partner Tasks UI Integration Guide

This guide shows the minimal changes needed to integrate partner tasks into the existing daily tasks UI.

## Overview

Partner tasks appear in the same daily task list as personal tasks, but with a small "Partner" label and an indicator showing whether your partner has completed the task today.

## 1. Update WebsiteContext to include Partner Tasks

Add partner tasks to the global context so they're available throughout the app.

**File: `src/lib/WebsiteContext.tsx`**

```typescript
// Add imports
import {
  getPartnerTasksForProfile,
  getPartnerTaskCompletionStatus,
  togglePartnerTaskCompletion,
  type PartnerTask,
} from './partnerTasks'

// Add to WebsiteContextValue interface
export interface WebsiteContextValue {
  // ... existing fields ...
  partnerTasks: PartnerTask[]
  partnerTasksLoading: boolean
  refreshPartnerTasks: () => Promise<void>
  completePartnerTask: (taskId: string, photo: File) => Promise<{ error: Error | null }>
  uncompletePartnerTask: (taskId: string, date: string) => Promise<{ error: Error | null }>
}

// In WebsiteProvider component, add state
const [partnerTasks, setPartnerTasks] = useState<PartnerTask[]>([])
const [partnerTasksLoading, setPartnerTasksLoading] = useState(true)

// Add function to fetch partner tasks
const fetchPartnerTasks = async () => {
  if (!profile?.id) return
  
  setPartnerTasksLoading(true)
  try {
    const { data, error } = await getPartnerTasksForProfile(profile.id)
    if (error) {
      console.error('Error fetching partner tasks:', error)
    } else {
      setPartnerTasks(data || [])
    }
  } finally {
    setPartnerTasksLoading(false)
  }
}

// Call fetchPartnerTasks when profile loads
useEffect(() => {
  if (profile?.id) {
    fetchPartnerTasks()
  }
}, [profile?.id])

// Add function to complete partner task
const completePartnerTask = async (taskId: string, photo: File) => {
  if (!profile?.id) return { error: new Error('No profile') }
  
  try {
    // Upload photo to storage (reuse existing photo upload logic)
    const photoUrl = await uploadPhotoToStorage(photo, profile.id, 'partner-tasks')
    
    // Toggle completion
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const { error, completed } = await togglePartnerTaskCompletion(
      profile.id,
      taskId,
      today,
      photoUrl
    )
    
    if (error) {
      return { error }
    }
    
    // Refresh partner tasks to update UI
    await fetchPartnerTasks()
    
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to complete partner task') }
  }
}

// Add function to uncomplete partner task
const uncompletePartnerTask = async (taskId: string, date: string) => {
  if (!profile?.id) return { error: new Error('No profile') }
  
  try {
    const { error } = await togglePartnerTaskCompletion(
      profile.id,
      taskId,
      date
    )
    
    if (error) {
      return { error }
    }
    
    // Refresh partner tasks to update UI
    await fetchPartnerTasks()
    
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to uncomplete partner task') }
  }
}

// Add to context value
const value: WebsiteContextValue = {
  // ... existing fields ...
  partnerTasks,
  partnerTasksLoading,
  refreshPartnerTasks: fetchPartnerTasks,
  completePartnerTask,
  uncompletePartnerTask,
}
```

## 2. Create PartnerTask Component

Create a new component for rendering partner tasks, similar to IndividualTask.

**File: `src/components/PartnerTask.tsx`**

See the separate `PartnerTask.tsx` file for the full implementation.

## 3. Update TaskList Component

Modify the TaskList component to include partner tasks.

**File: `src/components/TaskList.tsx`**

```typescript
// Add import
import { PartnerTask } from './PartnerTask'
import type { PartnerTask as PartnerTaskType } from '../lib/partnerTasks'

// Add to props interface
interface TaskListProps {
  individualTasks: Array<{
    id: string
    title: string
    completed: boolean
    completionId?: string
  }>
  groupTasks: Array<{
    id: string
    title: string
    group: string
    completed: boolean
  }>
  partnerTasks?: Array<{
    id: string
    title: string
    partnerName: string
    currentUserCompleted: boolean
    partnerCompleted: boolean
    completionId?: string
  }>
  onTaskComplete: (taskId: string, taskTitle: string, isGroup: boolean, completionId?: string) => void
  onTaskUncomplete: (taskId: string, completionId: string) => void
  onPartnerTaskComplete?: (taskId: string, taskTitle: string) => void
  onPartnerTaskUncomplete?: (taskId: string, date: string) => void
}

// In the render, add partner tasks section
export function TaskList({ 
  individualTasks, 
  groupTasks, 
  partnerTasks = [],
  onTaskComplete,
  onTaskUncomplete,
  onPartnerTaskComplete,
  onPartnerTaskUncomplete,
}: TaskListProps) {
  return (
    <div className="task-list">
      {/* Personal Tasks Section */}
      {individualTasks.length > 0 && (
        <div className="task-section">
          <h2 className="task-section-title">My Tasks</h2>
          {individualTasks.map((task) => (
            <IndividualTask
              key={task.id}
              {...task}
              onComplete={() => onTaskComplete(task.id, task.title, false, task.completionId)}
              onUncomplete={(completionId) => onTaskUncomplete(task.id, completionId)}
            />
          ))}
        </div>
      )}

      {/* Partner Tasks Section */}
      {partnerTasks.length > 0 && (
        <div className="task-section">
          <h2 className="task-section-title">Partner Tasks</h2>
          {partnerTasks.map((task) => (
            <PartnerTask
              key={task.id}
              id={task.id}
              title={task.title}
              partnerName={task.partnerName}
              currentUserCompleted={task.currentUserCompleted}
              partnerCompleted={task.partnerCompleted}
              onComplete={() => onPartnerTaskComplete?.(task.id, task.title)}
              onUncomplete={() => {
                const today = new Date().toISOString().split('T')[0]
                onPartnerTaskUncomplete?.(task.id, today)
              }}
            />
          ))}
        </div>
      )}

      {/* Group Tasks Section (existing) */}
      {groupTasks.length > 0 && (
        <div className="task-section">
          <h2 className="task-section-title">Group Tasks</h2>
          {/* ... existing group tasks rendering ... */}
        </div>
      )}

      {/* Empty state */}
      {individualTasks.length === 0 && partnerTasks.length === 0 && groupTasks.length === 0 && (
        <div className="task-list-empty">
          <p>No tasks yet. Create your first task to get started!</p>
        </div>
      )}
    </div>
  )
}
```

## 4. Update HomePage to Fetch and Display Partner Tasks

Modify HomePage to include partner tasks.

**File: `src/pages/HomePage.tsx`**

```typescript
export function HomePage() {
  const navigate = useNavigate()
  const { 
    profile, 
    tasks, 
    partnerTasks,
    loading: profileLoading,
    completeTask,
    uncompleteTask,
    completePartnerTask,
    uncompletePartnerTask,
  } = useWebsite()

  // ... existing code ...

  // Convert partner tasks to format expected by TaskList
  const partnerTasksForList = partnerTasks.map(task => {
    // Determine partner name
    const isCreator = task.creator_profile_id === profile?.id
    const partnerName = isCreator 
      ? 'Partner' // You can fetch the actual partner's name later
      : 'Partner'

    // Get today's completion status (you'll need to fetch this)
    // For now, we'll set as false - you can enhance this later
    const currentUserCompleted = false
    const partnerCompleted = false

    return {
      id: task.id,
      title: task.title,
      partnerName,
      currentUserCompleted,
      partnerCompleted,
    }
  })

  // Handler for completing partner task
  const handlePartnerTaskComplete = async (taskId: string, taskTitle: string) => {
    setSelectedTask({ id: taskId, title: taskTitle, isGroup: false })
    setCompletionModalOpen(true)
  }

  // Handler for uncompleting partner task
  const handlePartnerTaskUncomplete = async (taskId: string, date: string) => {
    const confirmed = window.confirm('Remove your completion for this partner task?')
    if (!confirmed) return

    const { error } = await uncompletePartnerTask(taskId, date)
    if (error) {
      alert(error.message)
    }
  }

  // Update task completion handler to handle both personal and partner tasks
  const handleTaskCompletion = async (photo: File, caption?: string) => {
    if (!selectedTask || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      // Determine if this is a partner task or personal task
      const isPartnerTask = partnerTasks.some(pt => pt.id === selectedTask.id)
      
      if (isPartnerTask) {
        const { error } = await completePartnerTask(selectedTask.id, photo)
        if (error) {
          alert(error.message || 'Failed to complete partner task')
          return
        }
      } else {
        const { error } = await completeTask(selectedTask.id, photo, caption)
        if (error) {
          alert(error.message || 'Failed to complete task')
          return
        }
      }

      setCompletionModalOpen(false)
      setSelectedTask(null)
    } catch (err) {
      console.error('Error completing task:', err)
      alert('Failed to complete task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="homepage">
      <div className="homepage-content">
        <UserHeader userName={userName} />
        
        <div className="homepage-main">
          <TaskList 
            individualTasks={individualTasks}
            groupTasks={groupTasks}
            partnerTasks={partnerTasksForList}
            onTaskComplete={handleTaskCompleteClick}
            onTaskUncomplete={handleTaskUncomplete}
            onPartnerTaskComplete={handlePartnerTaskComplete}
            onPartnerTaskUncomplete={handlePartnerTaskUncomplete}
          />
        </div>
      </div>

      {/* ... existing modal code ... */}
      
      <BottomNav />
    </div>
  )
}
```

## 5. Enhancements (Optional)

### Fetch Partner Completion Status

To show whether the partner has completed the task today, you can:

1. Create a new helper function that fetches completion status for all partner tasks:

```typescript
// In src/lib/partnerTasks.ts
export async function getPartnerTasksWithCompletionStatus(
  profileId: string,
  date: string
): Promise<{ error: Error | null; data?: Array<PartnerTask & {
  currentUserCompleted: boolean
  partnerCompleted: boolean
  currentUserCompletionId?: string
  partnerCompletionId?: string
}> }> {
  // Fetch partner tasks
  const { data: tasks, error: tasksError } = await getPartnerTasksForProfile(profileId)
  if (tasksError || !tasks) {
    return { error: tasksError }
  }

  // For each task, get completion status
  const tasksWithStatus = await Promise.all(
    tasks.map(async (task) => {
      const { data: status } = await getPartnerTaskCompletionStatus(task.id, date)
      return {
        ...task,
        currentUserCompleted: status?.currentUserCompleted || false,
        partnerCompleted: status?.partnerCompleted || false,
        currentUserCompletionId: status?.currentUserCompletionId,
        partnerCompletionId: status?.partnerCompletionId,
      }
    })
  )

  return { error: null, data: tasksWithStatus }
}
```

2. Use this in WebsiteContext instead of the basic `getPartnerTasksForProfile`.

### Add Partner Names

Fetch the partner's profile to display their name:

```typescript
// When fetching partner tasks, also fetch the partner profiles
const tasksWithPartnerProfiles = await Promise.all(
  tasks.map(async (task) => {
    const partnerId = task.creator_profile_id === profileId 
      ? task.partner_profile_id 
      : task.creator_profile_id

    if (partnerId) {
      const { data: partner } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', partnerId)
        .single()

      return {
        ...task,
        partnerName: partner 
          ? `${partner.first_name} ${partner.last_name}`.trim() || partner.username
          : 'Partner'
      }
    }

    return { ...task, partnerName: 'Partner' }
  })
)
```

## Summary

The key integration points are:

1. **Database**: Run the two SQL migrations to create the tables
2. **TypeScript Helpers**: Use `src/lib/partnerTasks.ts` for all partner task operations
3. **Context**: Add partner tasks to WebsiteContext for global state
4. **UI Components**: Create `PartnerTask.tsx` component (similar to `IndividualTask.tsx`)
5. **Task List**: Update `TaskList.tsx` to include partner tasks section
6. **Home Page**: Update `HomePage.tsx` to fetch and display partner tasks

All changes follow the existing patterns in your codebase, keeping modifications minimal and consistent with your current architecture.
