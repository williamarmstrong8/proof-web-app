import './Task.css'

interface GroupTaskProps {
  id: string
  title: string
  group: string
  completed: boolean
  onComplete?: () => void
}

export function GroupTask({ id, title, group, completed, onComplete }: GroupTaskProps) {
  const handleToggle = () => {
    if (!completed && onComplete) {
      onComplete()
    } else {
      // TODO: Handle uncompleting a task
      console.log('Uncomplete task:', id)
    }
  }

  return (
    <div className={`task task-group ${completed ? 'task-completed' : ''}`}>
      <button 
        className="task-checkbox"
        onClick={handleToggle}
        aria-label={`Mark ${title} as ${completed ? 'incomplete' : 'complete'}`}
      >
        {completed && <span className="task-checkmark">✓</span>}
      </button>
      <div className="task-content">
        <h3 className="task-title">{title}</h3>
        <p className="task-group-name">{group}</p>
      </div>
    </div>
  )
}

