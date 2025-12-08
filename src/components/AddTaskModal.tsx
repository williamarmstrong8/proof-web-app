import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import './AddTaskModal.css'

interface AddTaskModalProps {
  isOpen: boolean
  isCreating?: boolean
  onClose: () => void
  onAddTask: (task: { title: string; isGroup: boolean; groupName?: string }) => void
}

export function AddTaskModal({ isOpen, isCreating, onClose, onAddTask }: AddTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState('')
  const [isGroupTask, setIsGroupTask] = useState(false)
  const [groupName, setGroupName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskTitle.trim()) {
      onAddTask({
        title: taskTitle.trim(),
        isGroup: isGroupTask,
        groupName: isGroupTask ? groupName.trim() : undefined,
      })
      handleReset()
    }
  }

  const handleReset = () => {
    setTaskTitle('')
    setIsGroupTask(false)
    setGroupName('')
  }

  const handleClose = () => {
    if (isCreating) return // Prevent closing while creating
    handleReset()
    onClose()
  }

  return (
    <div className="add-task-modal-overlay" onClick={handleClose}>
      <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-task-modal-header">
          <h2 className="add-task-modal-title">Add New Task</h2>
          <button className="add-task-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form id="add-task-form" className="add-task-modal-form" onSubmit={handleSubmit}>
          <div className="add-task-form-group">
            <label htmlFor="task-title" className="add-task-label">
              Task Name
            </label>
            <input
              type="text"
              id="task-title"
              className="add-task-input"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Morning Run, Read for 30 minutes..."
              required
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div className="add-task-form-group">
            <label className="add-task-checkbox-label">
              <input
                type="checkbox"
                className="add-task-checkbox"
                checked={isGroupTask}
                onChange={(e) => setIsGroupTask(e.target.checked)}
                disabled={isCreating}
              />
              <span className="add-task-checkbox-text">Group Task</span>
            </label>
          </div>

          {isGroupTask && (
            <div className="add-task-form-group">
              <label htmlFor="group-name" className="add-task-label">
                Group Name
              </label>
              <input
                type="text"
                id="group-name"
                className="add-task-input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Fitness Club, Study Group..."
                required={isGroupTask}
                disabled={isCreating}
              />
            </div>
          )}
        </form>

        <div className="add-task-modal-actions">
          <button
            type="button"
            className="add-task-button add-task-button-cancel"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-task-form"
            className="add-task-button add-task-button-submit"
            disabled={isCreating}
          >
            <Plus size={16} />
            {isCreating ? 'Creating...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

