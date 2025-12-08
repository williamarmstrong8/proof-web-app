import { useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { ChallengeGrid } from '../components/ChallengeGrid'
import { ChallengeModal } from '../components/ChallengeModal'
import './ChallengesPage.css'

interface Challenge {
  id: string
  title: string
  description: string
  image: string
  duration: string
  participants: number
}

export function ChallengesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock challenges data
  const challenges: Challenge[] = [
    {
      id: '1',
      title: '7-Day Discipline',
      description: 'Build consistency through daily discipline',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop',
      duration: '7 days',
      participants: 124,
    },
    {
      id: '2',
      title: '75 Hard',
      description: 'Mental toughness challenge',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      duration: '75 days',
      participants: 856,
    },
    {
      id: '3',
      title: 'Mind & Mood',
      description: 'Focus on mental wellness and clarity',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
      duration: '30 days',
      participants: 342,
    },
    {
      id: '4',
      title: '30-Day Fitness',
      description: 'Transform your body in 30 days',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop',
      duration: '30 days',
      participants: 521,
    },
    {
      id: '5',
      title: 'Reading Challenge',
      description: 'Read consistently every day',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
      duration: '21 days',
      participants: 289,
    },
    {
      id: '6',
      title: 'Morning Routine',
      description: 'Start each day with intention',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
      duration: '14 days',
      participants: 198,
    },
  ]

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedChallenge(null)
  }

  const handleJoinChallenge = (challengeId: string) => {
    // TODO: Implement join challenge functionality
    console.log('Join challenge:', challengeId)
  }

  return (
    <div className="challenges-page">
      <div className="challenges-content">
        <div className="challenges-header">
          <h1 className="challenges-title">Challenges</h1>
          <p className="challenges-description">
            Pick a challenge, invite your friends, and stay accountable together. 
            Each challenge has its own rules and daily tasks. Complete them one day at a time and prove your consistency.
          </p>
        </div>

        <div className="challenges-explore">
          <h2 className="challenges-explore-title">Explore</h2>
          <ChallengeGrid 
            challenges={challenges}
            onChallengeClick={handleChallengeClick}
          />
        </div>
      </div>

      <ChallengeModal
        isOpen={isModalOpen}
        challenge={selectedChallenge}
        onClose={handleCloseModal}
        onJoin={handleJoinChallenge}
      />

      <BottomNav />
    </div>
  )
}

