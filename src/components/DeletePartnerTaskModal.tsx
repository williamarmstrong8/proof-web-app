import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import './AddTaskModal.css'

interface DeletePartnerTaskModalProps {
  isOpen: boolean
  taskTitle: string
  isDeleting?: boolean
  initialShowDeleteConfirm?: boolean
  onClose: () => void
  onDelete: () => void
}

export function DeletePartnerTaskModal({ 
  isOpen, 
  taskTitle,
  isDeleting,
  initialShowDeleteConfirm = false,
  onClose, 
  onDelete
}: DeletePartnerTaskModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialShowDeleteConfirm)

  // Update local state when props change
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(initialShowDeleteConfirm)
    }
  }, [isOpen, initialShowDeleteConfirm])

  if (!isOpen) return null

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    // User confirmed deletion
    onDelete()
  }

  const handleClose = () => {
    if (isDeleting) return
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <div className="add-task-modal-overlay" onClick={handleClose}>
      <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-task-modal-header">
          <h2 className="add-task-modal-title">Delete Partner Task</h2>
          <button 
            className="add-task-modal-close" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="add-task-modal-content" style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'hsl(var(--foreground))' }}>
            Are you sure you want to delete the partner task <strong>"{taskTitle}"</strong>?
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
            This will permanently delete the task and all its completions. This action cannot be undone.
          </p>
        </div>

        <div className="add-task-modal-actions">
          <button
            type="button"
            className="add-task-button add-task-button-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete Task'}
          </button>
          <button
            type="button"
            className="add-task-button add-task-button-cancel"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
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
