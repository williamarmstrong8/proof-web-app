import { MoreVertical } from 'lucide-react'
import './Task.css'

interface IndividualTaskProps {
  id: string
  title: string
  description?: string | null
  completed: boolean
  completionId?: string
  onComplete?: () => void
  onUncomplete?: (completionId: string) => void
  onEdit?: () => void
}

export function IndividualTask({ 
  id: _id,
  title, 
  description,
  completed, 
  completionId, 
  onComplete, 
  onUncomplete,
  onEdit
}: IndividualTaskProps) {
  const handleToggle = () => {
    if (!completed && onComplete) {
      onComplete()
    } else if (completed && completionId && onUncomplete) {
      onUncomplete(completionId)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  return (
    <div className={`task task-individual ${completed ? 'task-completed' : ''}`}>
      <button 
        className="task-checkbox"
        onClick={handleToggle}
        aria-label={`Mark ${title} as ${completed ? 'incomplete' : 'complete'}`}
      >
        {completed && <span className="task-checkmark">✓</span>}
      </button>
      <div className="task-content">
        <h3 className="task-title">{title}</h3>
        {description && <p className="task-description">{description}</p>}
      </div>
      <div className="task-actions">
        <button
          className="task-menu-button"
          onClick={handleMenuClick}
          aria-label="Edit task"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )
}

