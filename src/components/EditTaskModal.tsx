import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import './AddTaskModal.css'

interface EditTaskModalProps {
  isOpen: boolean
  taskId: string
  currentTitle: string
  currentDescription?: string | null
  isUpdating?: boolean
  isDeleting?: boolean
  initialShowDeleteConfirm?: boolean
  onClose: () => void
  onUpdate: (title: string, description?: string) => void
  onDelete: () => void
}

export function EditTaskModal({ 
  isOpen, 
  taskId: _taskId,
  currentTitle, 
  currentDescription,
  isUpdating,
  isDeleting,
  initialShowDeleteConfirm = false,
  onClose, 
  onUpdate,
  onDelete
}: EditTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState(currentTitle)
  const [taskDescription, setTaskDescription] = useState(currentDescription || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialShowDeleteConfirm)

  // Update local state when props change
  useEffect(() => {
    if (isOpen) {
      setTaskTitle(currentTitle)
      setTaskDescription(currentDescription || '')
      setShowDeleteConfirm(initialShowDeleteConfirm)
    }
  }, [isOpen, currentTitle, currentDescription, initialShowDeleteConfirm])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (taskTitle.trim()) {
      onUpdate(taskTitle.trim(), taskDescription.trim() || undefined)
    }
  }

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    // User confirmed deletion
    onDelete()
  }

  const handleClose = () => {
    if (isUpdating || isDeleting) return
    setTaskTitle(currentTitle)
    setTaskDescription(currentDescription || '')
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <div className="add-task-modal-overlay" onClick={handleClose}>
      <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-task-modal-header">
          <h2 className="add-task-modal-title">Edit Task</h2>
          <button 
            className="add-task-modal-close" 
            onClick={handleClose}
            disabled={isUpdating || isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        <form id="edit-task-form" className="add-task-modal-form" onSubmit={handleSubmit}>
          <div className="add-task-form-group">
            <label htmlFor="edit-task-title" className="add-task-label">
              Task Name
            </label>
            <input
              type="text"
              id="edit-task-title"
              className="add-task-input"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Morning Run, Read for 30 minutes..."
              required
              autoFocus
              disabled={isUpdating || isDeleting}
            />
          </div>

          <div className="add-task-form-group">
            <label htmlFor="edit-task-description" className="add-task-label">
              Description (Optional)
            </label>
            <textarea
              id="edit-task-description"
              className="add-task-input"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add a description for this task..."
              rows={3}
              disabled={isUpdating || isDeleting}
            />
          </div>
        </form>

        <div className="add-task-modal-actions">
          <button
            type="button"
            className="add-task-button add-task-button-danger"
            onClick={handleDelete}
            disabled={isUpdating || isDeleting}
          >
            <Trash2 size={16} />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
          </button>
          <button
            type="button"
            className="add-task-button add-task-button-cancel"
            onClick={handleClose}
            disabled={isUpdating || isDeleting}
          >
            Cancel
          </button>
            <button 
              type="submit" 
              form="edit-task-form"
              className="add-task-button add-task-button-submit"
              disabled={isUpdating || isDeleting || !taskTitle.trim()}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
        </div>

        {showDeleteConfirm && (
          <div style={{ 
            margin: '0 24px 24px 24px',
            padding: '12px', 
            background: 'hsl(var(--destructive) / 0.1)', 
            borderRadius: '8px',
            border: '1px solid hsl(var(--destructive) / 0.2)'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: 'hsl(var(--destructive))',
              margin: 0,
              textAlign: 'center'
            }}>
              ⚠️ This will permanently delete the task and all its completions. This cannot be undone.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
