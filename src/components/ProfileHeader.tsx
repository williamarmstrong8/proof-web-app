import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import './ProfileHeader.css'

interface UserData {
  name: string
  username: string
  bio: string
  avatarUrl?: string | null
  stats: {
    posts: number
    habits: number
    streak: number
    friends?: number
  }
}

interface ProfileHeaderProps {
  userData: UserData
}

export function ProfileHeader({ userData }: ProfileHeaderProps) {
  const navigate = useNavigate()

  // Get first and last initials
  const nameParts = userData.name.trim().split(/\s+/)
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || ''
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() : ''
  const initials = `${firstInitial}${lastInitial}`

  const handleEditClick = () => {
    navigate('/edit-profile')
  }

  const handleAddFriendsClick = () => {
    navigate('/add-friends')
  }

  const handleFriendsClick = () => {
    navigate('/friends')
  }

  return (
    <div className="profile-header">
      <div className="profile-header-top">
        <div className="profile-avatar">
          <div className="profile-avatar-initial">{initials}</div>
        </div>
        
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{userData.stats.posts}</span>
            <span className="profile-stat-label">Posts</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{userData.stats.habits}</span>
            <span className="profile-stat-label">Habits</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{userData.stats.streak}</span>
            <span className="profile-stat-label">Streak</span>
          </div>
          {userData.stats.friends !== undefined && (
            <div 
              className="profile-stat profile-stat-clickable"
              onClick={handleFriendsClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFriendsClick()
                }
              }}
              aria-label={`View ${userData.stats.friends} friends`}
            >
              <span className="profile-stat-value">{userData.stats.friends}</span>
              <span className="profile-stat-label">Friends</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="profile-info">
        <h1 className="profile-name">{userData.name}</h1>
        <p className="profile-username">{userData.username}</p>
        <p className="profile-bio">{userData.bio}</p>
      </div>
      
      <div className="profile-actions">
        <button className="profile-edit-button" onClick={handleEditClick}>
          Edit Profile
        </button>
        <button className="profile-add-friends-button" onClick={handleAddFriendsClick}>
          <UserPlus size={18} />
          Add Friends
        </button>
      </div>
    </div>
  )
}

