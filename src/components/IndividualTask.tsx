import './Task.css'

interface IndividualTaskProps {
  id: string
  title: string
  completed: boolean
  completionId?: string
  onComplete?: () => void
  onUncomplete?: (completionId: string) => void
}

export function IndividualTask({ title, completed, completionId, onComplete, onUncomplete }: IndividualTaskProps) {
  const handleToggle = () => {
    if (!completed && onComplete) {
      onComplete()
    } else if (completed && completionId && onUncomplete) {
      onUncomplete(completionId)
    }
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
      </div>
    </div>
  )
}

