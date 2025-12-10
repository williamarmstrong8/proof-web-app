import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { IndividualTask } from './IndividualTask'
import { PartnerTask } from './PartnerTask'
import { AddTaskModal } from './AddTaskModal'
import { EditTaskModal } from './EditTaskModal'
import { DeletePartnerTaskModal } from './DeletePartnerTaskModal'
import { useWebsite } from '../lib/WebsiteContext'
import './TaskList.css'

interface Task {
  id: string
  title: string
  completed: boolean
  group?: string
  completionId?: string
}

interface TaskListProps {
  individualTasks: Task[]
  groupTasks?: Task[] // Made optional since we're removing it
  onTaskComplete?: (taskId: string, taskTitle: string, isGroup: boolean, completionId?: string, taskType?: 'personal' | 'partner') => void
  onTaskUncomplete?: (taskId: string, completionId: string, taskType?: 'personal' | 'partner') => void
  onPartnerTaskDelete?: (taskId: string) => void
  partnerTaskRefreshKey?: number
}

export function TaskList({ individualTasks, groupTasks = [], onTaskComplete, onTaskUncomplete, onPartnerTaskDelete, partnerTaskRefreshKey }: TaskListProps) {
  const { 
    createTask, 
    updateTask, 
    deleteTask, 
    tasks,
    partnerTasks,
    createPartnerTask,
  } = useWebsite()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<{ id: string; title: string; description?: string | null; showDeleteConfirm?: boolean } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingPartnerTask, setDeletingPartnerTask] = useState<{ id: string; title: string } | null>(null)
  const [isDeletingPartnerTask, setIsDeletingPartnerTask] = useState(false)

  const handleAddTask = async (task: { title: string; isGroup: boolean; groupName?: string }) => {
    if (isCreating) return

    try {
      setIsCreating(true)
      
      // For now, only support individual tasks (group tasks coming later)
      if (!task.isGroup) {
        const { error } = await createTask(task.title)
        if (error) {
          console.error('Error creating task:', error)
          alert(error.message || 'Failed to create task')
          return
        }
      } else {
        alert('Group tasks are coming soon!')
        return
      }
      
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating task:', err)
      alert('Failed to create task')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddPartnerTask = async (task: { title: string; description?: string; partnerId: string }) => {
    if (isCreating) return

    try {
      setIsCreating(true)
      
      const { error } = await createPartnerTask(task.title, task.description, task.partnerId)
      if (error) {
        console.error('Error creating partner task:', error)
        alert(error.message || 'Failed to create partner task')
        return
      }
      
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating partner task:', err)
      alert('Failed to create partner task')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditTask = (taskId: string, showDeleteConfirm = false) => {
    const fullTask = tasks.find(t => t.id === taskId)
    if (fullTask) {
      setEditingTask({
        id: taskId,
        title: fullTask.title,
        description: fullTask.description || null,
        showDeleteConfirm,
      })
    }
  }

  const handleUpdateTask = async (title: string, description?: string) => {
    if (!editingTask || isUpdating) return

    try {
      setIsUpdating(true)
      const { error } = await updateTask(editingTask.id, title, description)
      if (error) {
        console.error('Error updating task:', error)
        alert(error.message || 'Failed to update task')
        return
      }
      setEditingTask(null)
    } catch (err) {
      console.error('Error updating task:', err)
      alert('Failed to update task')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      const { error } = await deleteTask(taskId)
      if (error) {
        console.error('Error deleting task:', error)
        alert(error.message || 'Failed to delete task')
        return
      }
      // If deleting the task being edited, close the edit modal
      if (editingTask?.id === taskId) {
        setEditingTask(null)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="task-list">
        <div className="task-section">
          <div className="task-section-header">
            <h2 className="task-section-title">Individual Tasks</h2>
            <button 
              className="task-add-button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Add new task"
            >
              <Plus size={20} />
              Add New Task
            </button>
          </div>
          <div className="task-items">
            {individualTasks.length === 0 ? (
              <div className="task task-individual" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                cursor: 'default',
                opacity: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    minWidth: '24px',
                    border: '2px solid rgba(0, 0, 0, 0.2)',
                    background: 'transparent',
                    borderRadius: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    <span style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.3)' }}>✓</span>
                  </div>
                  <div className="task-content" style={{ flex: 1 }}>
                    <h3 className="task-title" style={{ marginBottom: '8px' }}>
                      Create Your First Habit
                    </h3>
                    <p className="task-description" style={{ marginBottom: '16px' }}>
                      Start building better habits by creating your first task. Track your progress daily and build streaks to stay motivated!
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        padding: '12px 24px',
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#333'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#000'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      Create First Habit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              individualTasks.map((task) => {
                const fullTask = tasks.find(t => t.id === task.id)
                return (
                  <IndividualTask
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    description={fullTask?.description}
                    completed={task.completed}
                    completionId={task.completionId}
                    onComplete={() => onTaskComplete?.(task.id, task.title, false, task.completionId, 'personal')}
                    onUncomplete={(completionId) => onTaskUncomplete?.(task.id, completionId, 'personal')}
                    onEdit={() => handleEditTask(task.id, false)}
                  />
                )
              })
            )}
          </div>
        </div>

        {partnerTasks.length > 0 && (
        <div className="task-section">
            <h2 className="task-section-title">Partner Tasks</h2>
          <div className="task-items">
              {partnerTasks
                .filter(task => task.status === 'accepted' || task.status === 'pending')
                .map((task) => (
                  <PartnerTask
                key={task.id}
                    partnerTask={task}
                    refreshKey={partnerTaskRefreshKey}
                    onComplete={() => onTaskComplete?.(task.id, task.title, false, undefined, 'partner')}
                    onUncomplete={() => {
                      const today = new Date().toISOString().split('T')[0]
                      // Pass date as completionId for partner tasks (HomePage will handle it)
                      onTaskUncomplete?.(task.id, today, 'partner')
                    }}
                    onEdit={() => {
                      setDeletingPartnerTask({ id: task.id, title: task.title })
                    }}
              />
            ))}
          </div>
        </div>
        )}

      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        isCreating={isCreating}
        onClose={() => !isCreating && setIsModalOpen(false)}
        onAddTask={handleAddTask}
        onAddPartnerTask={handleAddPartnerTask}
      />

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          taskId={editingTask.id}
          currentTitle={editingTask.title}
          currentDescription={editingTask.description}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          initialShowDeleteConfirm={editingTask.showDeleteConfirm}
          onClose={() => {
            if (!isUpdating && !isDeleting) {
              setEditingTask(null)
            }
          }}
          onUpdate={handleUpdateTask}
          onDelete={async () => {
            await handleDeleteTask(editingTask.id)
          }}
        />
      )}

      {deletingPartnerTask && (
        <DeletePartnerTaskModal
          isOpen={!!deletingPartnerTask}
          taskTitle={deletingPartnerTask.title}
          isDeleting={isDeletingPartnerTask}
          onClose={() => {
            if (!isDeletingPartnerTask) {
              setDeletingPartnerTask(null)
            }
          }}
          onDelete={async () => {
            if (!onPartnerTaskDelete || isDeletingPartnerTask) return
            setIsDeletingPartnerTask(true)
            try {
              await onPartnerTaskDelete(deletingPartnerTask.id)
              setDeletingPartnerTask(null)
            } catch (err) {
              console.error('Error deleting partner task:', err)
            } finally {
              setIsDeletingPartnerTask(false)
            }
          }}
        />
      )}
    </>
  )
}

