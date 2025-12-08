import { useState } from 'react'
import { Plus } from 'lucide-react'
import { IndividualTask } from './IndividualTask'
import { GroupTask } from './GroupTask'
import { AddTaskModal } from './AddTaskModal'
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
  const { createTask } = useWebsite()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

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
            {individualTasks.map((task) => (
              <IndividualTask
                key={task.id}
                id={task.id}
                title={task.title}
                completed={task.completed}
                completionId={task.completionId}
                onComplete={() => onTaskComplete?.(task.id, task.title, false, task.completionId)}
                onUncomplete={(completionId) => onTaskUncomplete?.(task.id, completionId)}
              />
            ))}
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
    </>
  )
}

