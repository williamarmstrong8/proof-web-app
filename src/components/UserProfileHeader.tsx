import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './UserProfileHeader.css'

interface UserData {
  name: string
  username: string
  bio: string
  avatar: string
  stats: {
    posts: number
    habits: number
    streak: number
  }
}

interface UserProfileHeaderProps {
  userData: UserData
}

export function UserProfileHeader({ userData }: UserProfileHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="user-profile-header">
      <button className="user-profile-back-button" onClick={() => navigate('/social')}>
        <ArrowLeft size={24} />
      </button>
      
      <div className="user-profile-header-top">
        <div className="user-profile-avatar">
          <img 
            src={userData.avatar} 
            alt={userData.name}
            className="user-profile-avatar-img"
          />
        </div>
        
        <div className="user-profile-stats">
          <div className="user-profile-stat">
            <span className="user-profile-stat-value">{userData.stats.posts}</span>
            <span className="user-profile-stat-label">Posts</span>
          </div>
          <div className="user-profile-stat">
            <span className="user-profile-stat-value">{userData.stats.habits}</span>
            <span className="user-profile-stat-label">Habits</span>
          </div>
          <div className="user-profile-stat">
            <span className="user-profile-stat-value">{userData.stats.streak}</span>
            <span className="user-profile-stat-label">Streak</span>
          </div>
        </div>
      </div>
      
      <div className="user-profile-info">
        <h1 className="user-profile-name">{userData.name}</h1>
        <p className="user-profile-username">{userData.username}</p>
        <p className="user-profile-bio">{userData.bio}</p>
      </div>
    </div>
  )
}

