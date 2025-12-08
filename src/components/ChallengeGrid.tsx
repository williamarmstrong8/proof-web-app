import { ChallengeCard } from './ChallengeCard'
import './ChallengeGrid.css'

interface Challenge {
  id: string
  title: string
  description: string
  image: string
  duration: string
  participants: number
}

interface ChallengeGridProps {
  challenges: Challenge[]
  onChallengeClick: (challenge: Challenge) => void
}

export function ChallengeGrid({ challenges, onChallengeClick }: ChallengeGridProps) {
  return (
    <div className="challenge-grid">
      {challenges.map((challenge) => (
        <ChallengeCard 
          key={challenge.id} 
          challenge={challenge}
          onClick={onChallengeClick}
        />
      ))}
    </div>
  )
}

