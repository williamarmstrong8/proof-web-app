import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { TaskList } from '../components/TaskList'
import { UserHeader } from '../components/UserHeader'
import { TaskCompletionModal } from '../components/TaskCompletionModal'
import { useWebsite } from '../lib/WebsiteContext'
import './HomePage.css'

export function HomePage() {
  const navigate = useNavigate()
  // Get profile and tasks from WebsiteContext
  const { profile, tasks, loading: profileLoading, completeTask, uncompleteTask } = useWebsite()
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

  // Group tasks will come later - for now, empty array
  const groupTasks: Array<{ id: string; title: string; group: string; completed: boolean }> = []

  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string; isGroup: boolean; completionId?: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTaskCompleteClick = (taskId: string, taskTitle: string, isGroup: boolean, completionId?: string) => {
    setSelectedTask({ id: taskId, title: taskTitle, isGroup, completionId })
    setCompletionModalOpen(true)
  }

  const handleTaskCompletion = async (photo: File, caption?: string) => {
    if (!selectedTask || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      // Call completeTask from WebsiteContext
      const { error } = await completeTask(selectedTask.id, photo, caption)
      
      if (error) {
        console.error('Error completing task:', error)
        alert(error.message || 'Failed to complete task')
        return
      }

      // Success - close modal
      setCompletionModalOpen(false)
      setSelectedTask(null)
    } catch (err) {
      console.error('Error completing task:', err)
      alert('Failed to complete task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTaskUncomplete = async (taskId: string, completionId: string) => {
    const confirmed = window.confirm('Are you sure you want to uncheck this task? This will delete your proof photo and post.')
    if (!confirmed) return

    const { error } = await uncompleteTask(taskId, completionId)
    if (error) {
      console.error('Error uncompleting task:', error)
      alert(error.message || 'Failed to uncomplete task')
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
            onTaskComplete={handleTaskCompleteClick}
            onTaskUncomplete={handleTaskUncomplete}
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

