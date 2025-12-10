import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { TaskList } from '../components/TaskList'
import { UserHeader } from '../components/UserHeader'
import { TaskCompletionModal } from '../components/TaskCompletionModal'
import { PartnerTaskInvites } from '../components/PartnerTaskInvites'
import { useWebsite } from '../lib/WebsiteContext'
import { triggerFireworks } from '../lib/confetti'
import './HomePage.css'

export function HomePage() {
  const navigate = useNavigate()
  // Get profile and tasks from WebsiteContext
  const { 
    profile, 
    tasks, 
    loading: profileLoading, 
    completeTask, 
    uncompleteTask,
    completePartnerTask,
    uncompletePartnerTask,
    deletePartnerTask,
    refetchPartnerTasks,
  } = useWebsite()
  const userName = profile 
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
    : 'User'

  // Redirect to create-profile if profile is incomplete (after loading completes)
  useEffect(() => {
    if (profileLoading) {
      return
    }

    if (!profile || !profile.first_name || !profile.username) {
      navigate('/create-profile', { replace: true })
      return
    }
  }, [profileLoading, profile?.id, profile?.first_name, profile?.username, navigate])

  // Convert tasks from WebsiteContext to format expected by TaskList
  const individualTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed_today || false,
    completionId: task.completion_id,
  }))


  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string; isGroup: boolean; taskType: 'personal' | 'partner'; completionId?: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [partnerTaskRefreshKey, setPartnerTaskRefreshKey] = useState(0)

  const handleTaskCompleteClick = (taskId: string, taskTitle: string, isGroup: boolean, completionId?: string, taskType: 'personal' | 'partner' = 'personal') => {
    console.log('[HomePage] Task complete click:', { taskId, taskTitle, taskType })
    setSelectedTask({ id: taskId, title: taskTitle, isGroup, taskType, completionId })
    setCompletionModalOpen(true)
  }

  const handleTaskCompletion = async (photo: File, caption?: string) => {
    if (!selectedTask || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      // Use the explicit taskType to determine if this is a partner task
      const isPartnerTask = selectedTask.taskType === 'partner'
      console.log('[HomePage] Completing task:', { id: selectedTask.id, type: selectedTask.taskType, isPartnerTask })
      
      if (isPartnerTask) {
        // Complete partner task (no caption for partner tasks)
        const { error } = await completePartnerTask(selectedTask.id, photo)
        
        if (error) {
          console.error('Error completing partner task:', error)
          alert(error.message || 'Failed to complete partner task')
          return
        }
      } else {
        // Complete regular task
      const { error } = await completeTask(selectedTask.id, photo, caption)
      
      if (error) {
        console.error('Error completing task:', error)
        alert(error.message || 'Failed to complete task')
        return
        }
      }

      // Success - close modal and refresh partner tasks
    setCompletionModalOpen(false)
    setSelectedTask(null)
      
      // Trigger confetti celebration
      triggerFireworks()
      
      // Refresh partner tasks to update completion status
      if (isPartnerTask) {
        await refetchPartnerTasks()
        // Increment refresh key to trigger PartnerTaskProgress refresh
        setPartnerTaskRefreshKey(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error completing task:', err)
      alert('Failed to complete task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePartnerTaskDelete = async (taskId: string) => {
    const { error } = await deletePartnerTask(taskId)
    if (error) {
      console.error('Error deleting partner task:', error)
      alert(error.message || 'Failed to delete partner task')
    } else {
      // Refresh partner tasks to update UI
      await refetchPartnerTasks()
      setPartnerTaskRefreshKey(prev => prev + 1)
    }
  }

  const handleTaskUncomplete = async (taskId: string, completionId: string, taskType: 'personal' | 'partner' = 'personal') => {
    console.log('[HomePage] Task uncomplete:', { taskId, completionId, taskType })
    // Use explicit taskType to determine if this is a partner task
    const isPartnerTask = taskType === 'partner'
    
    if (isPartnerTask) {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await uncompletePartnerTask(taskId, today)
      if (error) {
        console.error('Error uncompleting partner task:', error)
        alert(error.message || 'Failed to uncomplete partner task')
      } else {
        // Refresh partner tasks to update completion status
        await refetchPartnerTasks()
        // Increment refresh key to trigger PartnerTaskProgress refresh
        setPartnerTaskRefreshKey(prev => prev + 1)
      }
    } else {
    const { error } = await uncompleteTask(taskId, completionId)
    if (error) {
      console.error('Error uncompleting task:', error)
      alert(error.message || 'Failed to uncomplete task')
      }
    }
  }

  return (
    <div className="homepage">
      <div className="homepage-content">
        <UserHeader userName={userName} />
        
        <div className="homepage-main">
          <PartnerTaskInvites 
            onInviteAccepted={() => {
              // Invites and tasks are already refetched in PartnerTaskInvites component
            }}
            onInviteDeclined={() => {
              // Invites are already refetched in PartnerTaskInvites component
            }}
          />
          
          <TaskList 
            individualTasks={individualTasks}
            onTaskComplete={handleTaskCompleteClick}
            onTaskUncomplete={handleTaskUncomplete}
            onPartnerTaskDelete={handlePartnerTaskDelete}
            partnerTaskRefreshKey={partnerTaskRefreshKey}
          />
        </div>
      </div>

      {selectedTask && (
        <TaskCompletionModal
          isOpen={completionModalOpen}
          taskTitle={selectedTask.title}
          isSubmitting={isSubmitting}
          onClose={() => {
            if (!isSubmitting) {
            setCompletionModalOpen(false)
            setSelectedTask(null)
            }
          }}
          onComplete={handleTaskCompletion}
        />
      )}
      
      <BottomNav />
    </div>
  )
}

