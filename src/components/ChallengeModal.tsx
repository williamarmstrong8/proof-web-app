import { X, Calendar, Users, CheckCircle2, Trophy } from 'lucide-react'
import './ChallengeModal.css'

interface Challenge {
  id: string
  title: string
  description: string
  image: string
  duration: string
  participants: number
  fullDescription?: string
  rules?: string[]
  tasks?: string[]
}

interface ChallengeModalProps {
  isOpen: boolean
  challenge: Challenge | null
  onClose: () => void
  onJoin: (challengeId: string) => void
}

export function ChallengeModal({ isOpen, challenge, onClose, onJoin }: ChallengeModalProps) {
  if (!isOpen || !challenge) return null

  const handleJoin = () => {
    onJoin(challenge.id)
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Mock detailed data for each challenge
  const getChallengeDetails = (id: string) => {
    const details: Record<string, { fullDescription: string; rules: string[]; tasks: string[] }> = {
      '1': {
        fullDescription: 'Build discipline through consistent daily actions. This 7-day challenge helps you establish routines and stick to commitments.',
        rules: [
          'Complete your chosen daily tasks every day',
          'Post proof of completion',
          'No skipping days - start over if you miss',
          'Support your fellow challengers'
        ],
        tasks: [
          'Choose 3 daily tasks to complete',
          'Track your progress daily',
          'Share updates with the community'
        ]
      },
      '2': {
        fullDescription: 'A mental toughness program designed to build discipline, confidence, self-esteem, fortitude and grittiness. This is the hardest challenge you will ever do.',
        rules: [
          'Follow a diet (any diet of your choice)',
          'Complete two 45-minute workouts per day',
          'Drink one gallon of water daily',
          'Read 10 pages of non-fiction',
          'Take a progress photo daily'
        ],
        tasks: [
          'Morning workout',
          'Evening workout',
          'Reading session',
          'Progress photo',
          'Hydration tracking'
        ]
      },
      '3': {
        fullDescription: 'Focus on mental wellness, clarity, and emotional balance. Develop habits that support your mental health and mood regulation.',
        rules: [
          'Daily meditation or mindfulness practice',
          'Gratitude journaling',
          'Digital detox periods',
          'Regular sleep schedule',
          'Connect with nature daily'
        ],
        tasks: [
          'Morning meditation',
          'Gratitude entry',
          'Nature walk or time outside',
          'Evening reflection'
        ]
      },
    }
    return details[id] || {
      fullDescription: challenge.description,
      rules: ['Complete all daily tasks', 'Post proof of completion'],
      tasks: ['Follow the challenge guidelines', 'Track your progress']
    }
  }

  const details = getChallengeDetails(challenge.id)

  return (
    <div className="challenge-modal-overlay" onClick={handleOverlayClick}>
      <div className="challenge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="challenge-modal-image-container">
          <img 
            src={challenge.image} 
            alt={challenge.title}
            className="challenge-modal-image"
          />
          <button className="challenge-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="challenge-modal-content">
          <div className="challenge-modal-header">
            <h2 className="challenge-modal-title">{challenge.title}</h2>
            <div className="challenge-modal-meta">
              <div className="challenge-modal-meta-item">
                <Calendar className="challenge-modal-meta-icon" size={18} />
                <span>{challenge.duration}</span>
              </div>
              <div className="challenge-modal-meta-item">
                <Users className="challenge-modal-meta-icon" size={18} />
                <span>{challenge.participants.toLocaleString()} participants</span>
              </div>
            </div>
          </div>

          <div className="challenge-modal-section">
            <h3 className="challenge-modal-section-title">Description</h3>
            <p className="challenge-modal-description">{details.fullDescription}</p>
          </div>

          <div className="challenge-modal-section">
            <h3 className="challenge-modal-section-title">Rules</h3>
            <ul className="challenge-modal-list">
              {details.rules.map((rule, index) => (
                <li key={index} className="challenge-modal-list-item">
                  <CheckCircle2 className="challenge-modal-list-icon" size={16} />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="challenge-modal-section">
            <h3 className="challenge-modal-section-title">Daily Tasks</h3>
            <ul className="challenge-modal-list">
              {details.tasks.map((task, index) => (
                <li key={index} className="challenge-modal-list-item">
                  <Trophy className="challenge-modal-list-icon" size={16} />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="challenge-modal-actions">
            <button
              className="challenge-modal-button challenge-modal-button-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="challenge-modal-button challenge-modal-button-primary"
              onClick={handleJoin}
            >
              Join Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

