import { useState } from 'react'
import { Plus } from 'lucide-react'
import { IndividualTask } from './IndividualTask'
import { GroupTask } from './GroupTask'
import { AddTaskModal } from './AddTaskModal'
import { EditTaskModal } from './EditTaskModal'
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
  groupTasks: Task[]
  onTaskComplete?: (taskId: string, taskTitle: string, isGroup: boolean, completionId?: string) => void
  onTaskUncomplete?: (taskId: string, completionId: string) => void
}

export function TaskList({ individualTasks, groupTasks, onTaskComplete, onTaskUncomplete }: TaskListProps) {
  const { createTask, updateTask, deleteTask, tasks } = useWebsite()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<{ id: string; title: string; description?: string | null; showDeleteConfirm?: boolean } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
            {individualTasks.map((task) => {
              const fullTask = tasks.find(t => t.id === task.id)
              return (
                <IndividualTask
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={fullTask?.description}
                  completed={task.completed}
                  completionId={task.completionId}
                  onComplete={() => onTaskComplete?.(task.id, task.title, false, task.completionId)}
                  onUncomplete={(completionId) => onTaskUncomplete?.(task.id, completionId)}
                  onEdit={() => handleEditTask(task.id, false)}
                />
              )
            })}
          </div>
        </div>

        <div className="task-section">
          <h2 className="task-section-title">Group Tasks</h2>
          <div className="task-items">
            {groupTasks.map((task) => (
              <GroupTask
                key={task.id}
                id={task.id}
                title={task.title}
                group={task.group || ''}
                completed={task.completed}
                onComplete={() => onTaskComplete?.(task.id, task.title, true)}
              />
            ))}
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        isCreating={isCreating}
        onClose={() => !isCreating && setIsModalOpen(false)}
        onAddTask={handleAddTask}
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
    </>
  )
}

