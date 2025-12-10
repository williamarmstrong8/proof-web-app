import { useNavigate } from 'react-router-dom'
import { Verified } from 'lucide-react'
import './FriendCard.css'

interface Friend {
  id: string
  name: string
  username: string
  avatar: string
  streak: number
  isOnline?: boolean
}

interface FriendCardProps {
  friend: Friend
}

export function FriendCard({ friend }: FriendCardProps) {
  const navigate = useNavigate()
  const isMock = friend.id.startsWith('mock-')

  const handleClick = () => {
    if (isMock) return // Don't navigate for mock friends
    // Extract username from @username format
    const username = friend.username.replace('@', '')
    navigate(`/user/${username}`)
  }

  return (
    <div 
      className="friend-card" 
      onClick={handleClick}
      style={{ cursor: isMock ? 'default' : 'pointer', opacity: isMock ? 0.7 : 1 }}
    >
      <div className="friend-avatar-container">
        <img 
          src={friend.avatar} 
          alt={friend.name}
          className="friend-avatar"
        />
        {friend.isOnline && <span className="friend-online-indicator" />}
      </div>
      
      <div className="friend-info">
        <div className="friend-name-row">
          <span className="friend-name">{friend.name}</span>
          <Verified className="friend-verified-icon" size={14} />
        </div>
        <span className="friend-username">{friend.username}</span>
        <div className="friend-streak">
          <span className="friend-streak-label">Streak:</span>
          <span className="friend-streak-value">{friend.streak} {friend.streak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>
    </div>
  )
}

