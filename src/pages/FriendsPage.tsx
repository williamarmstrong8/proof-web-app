import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { FriendCard } from '../components/FriendCard'
import { useWebsite } from '../lib/WebsiteContext'
import './FriendsPage.css'

export function FriendsPage() {
  const navigate = useNavigate()
  const { friends: friendships } = useWebsite()

  // Transform friendships to Friend format for FriendCard
  const friends = friendships.map((friendship) => {
    const profile = friendship.profile
    const displayName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.username || profile.email || 'Unknown User'
    
    return {
      id: profile.id,
      name: displayName,
      username: profile.username ? `@${profile.username}` : '@no-username',
      avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
      streak: friendship.streak || 0,
      isOnline: false,
    }
  })

  return (
    <div className="friends-page">
      <div className="friends-page-content">
        <div className="friends-page-header">
          <button 
            className="friends-page-back-button"
            onClick={() => navigate('/profile')}
            aria-label="Back to profile"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="friends-page-title">
            <Users size={24} />
            Friends ({friends.length})
          </h1>
        </div>

        {friends.length === 0 ? (
          <div className="friends-page-empty">
            <Users size={48} className="friends-page-empty-icon" />
            <p className="friends-page-empty-text">No friends yet</p>
            <p className="friends-page-empty-hint">Add friends to see them here</p>
            <button
              className="friends-page-add-button"
              onClick={() => navigate('/add-friends')}
            >
              Add Friends
            </button>
          </div>
        ) : (
          <div className="friends-page-list">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  )
}
