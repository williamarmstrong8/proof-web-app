import './HabitHistory.css'

interface Habit {
  id: string
  name: string
  streak: number
  total: number
  color: string
}

interface HabitHistoryProps {
  habits: Habit[]
}

export function HabitHistory({ habits }: HabitHistoryProps) {
  return (
    <div className="habit-history-section">
      <h2 className="habit-history-title">Habit History</h2>
      <div className="habit-list">
        {habits.map((habit) => {
          const percentage = Math.round((habit.streak / habit.total) * 100)
          
          return (
            <div key={habit.id} className="habit-item">
              <div className="habit-header">
                <h3 className="habit-name">{habit.name}</h3>
                <div className="habit-stats">
                  <span className="habit-streak">{habit.streak} day streak</span>
                  <span className="habit-total">{habit.total} total</span>
                </div>
              </div>
              <div className="habit-progress-container">
                <div 
                  className="habit-progress-bar"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: habit.color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

