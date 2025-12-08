import './ChallengeCard.css'

interface Challenge {
  id: string
  title: string
  description: string
  image: string
  duration: string
  participants: number
}

interface ChallengeCardProps {
  challenge: Challenge
  onClick: (challenge: Challenge) => void
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const handleClick = () => {
    onClick(challenge)
  }

  return (
    <article className="challenge-card" onClick={handleClick}>
      <div className="challenge-image-container">
        <img 
          src={challenge.image} 
          alt={challenge.title}
          className="challenge-image"
          loading="lazy"
        />
        <div className="challenge-overlay">
          <h3 className="challenge-title-overlay">{challenge.title}</h3>
        </div>
      </div>
      
      <div className="challenge-info">
        <h3 className="challenge-title">{challenge.title}</h3>
        <p className="challenge-description">{challenge.description}</p>
        
        <div className="challenge-meta">
          <span className="challenge-duration">{challenge.duration}</span>
          <span className="challenge-participants">
            {challenge.participants.toLocaleString()} participants
          </span>
        </div>
      </div>
    </article>
  )
}

