import './UserProfileHeader.css'

interface UserData {
  name: string
  username: string
  bio: string
  avatarUrl?: string | null
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
  // Get first and last initials
  const nameParts = userData.name.trim().split(/\s+/)
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || ''
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() : ''
  const initials = `${firstInitial}${lastInitial}`

  return (
    <div className="user-profile-header">
      <div className="user-profile-header-top">
        <div className="user-profile-avatar">
          {userData.avatarUrl ? (
          <img 
              src={userData.avatarUrl} 
            alt={userData.name}
            className="user-profile-avatar-img"
          />
          ) : (
            <div className="user-profile-avatar-initial">{initials}</div>
          )}
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

