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

type HabitTier = 'bronze' | 'silver' | 'gold'

interface TierInfo {
  tier: HabitTier
  progress: number // 0-100
  currentTierProgress: number
  currentTierMax: number
}

function calculateTierInfo(streak: number): TierInfo {
  // Tier 1: 0-4 days (Bronze) - progress out of 5
  // At 5 days, card becomes silver and progress resets
  if (streak < 5) {
    return {
      tier: 'bronze',
      progress: Math.round((streak / 5) * 100),
      currentTierProgress: streak,
      currentTierMax: 5,
    }
  }
  
  // Tier 2: 5-24 days (Silver) - progress from 5 to 25 (20 day range)
  // Progress bar resets at 5 days, fills from 0% to 100% as streak goes 5→25
  if (streak < 25) {
    const tier2Progress = streak - 5 // Progress within tier 2 (0-19 days)
    return {
      tier: 'silver',
      progress: Math.round((tier2Progress / 20) * 100),
      currentTierProgress: tier2Progress,
      currentTierMax: 20,
    }
  }
  
  // Tier 3: 25+ days (Gold) - maxed out, progress bar at 100%
  return {
    tier: 'gold',
    progress: 100,
    currentTierProgress: streak - 25,
    currentTierMax: Infinity,
  }
}

export function HabitHistory({ habits }: HabitHistoryProps) {
  return (
    <div className="habit-history-section">
      <h2 className="habit-history-title">Habit History</h2>
      <div className="habit-list">
        {habits.map((habit) => {
          const tierInfo = calculateTierInfo(habit.streak)
          
          return (
            <div 
              key={habit.id} 
              className={`habit-item habit-item-${tierInfo.tier}`}
            >
              <div className="habit-header">
                <h3 className="habit-name">{habit.name}</h3>
                <div className="habit-stats">
                  <span className="habit-streak">{habit.streak} day streak</span>
                  <span className="habit-total">{habit.total} total</span>
                </div>
              </div>
              <div className="habit-progress-container">
                <div 
                  className={`habit-progress-bar habit-progress-bar-${tierInfo.tier}`}
                  style={{ 
                    width: `${tierInfo.progress}%`,
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

