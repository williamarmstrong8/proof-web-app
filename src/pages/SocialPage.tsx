import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PostFeed } from '../components/PostFeed'
import { FriendsSidebar } from '../components/FriendsSidebar'
import { useWebsite } from '../lib/WebsiteContext'
import './SocialPage.css'

export function SocialPage() {
  const navigate = useNavigate()
  const { incomingRequests, friends: friendships, friendPosts } = useWebsite()
  
  // Transform friendships to Friend format for FriendsSidebar
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
      streak: friendship.streak || 0, // Use calculated streak from WebsiteContext
      isOnline: false, // TODO: Add online status tracking if needed
    }
  })

  return (
    <div className="social-page">
      <div className="social-content">
        <div className="social-header">
          <div className="social-header-left">
            <h1 className="social-title">Social</h1>
            <p className="social-subtitle">Proof of progress from your friends</p>
          </div>
          <button 
            className="social-add-friends-button"
            onClick={() => navigate('/add-friends')}
            aria-label="Add friends"
          >
            <UserPlus size={20} />
            Add Friends
            {incomingRequests.length > 0 && (
              <span className="social-add-friends-badge">{incomingRequests.length}</span>
            )}
          </button>
        </div>
        
        <div className="social-main">
          <FriendsSidebar friends={friends} />
          
          <div className="social-feed-container">
            {friends.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: 'hsl(var(--muted-foreground))'
              }}>
                <p>No friends yet. Add friends to see their posts here!</p>
              </div>
            ) : friendPosts.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: 'hsl(var(--muted-foreground))'
              }}>
                <p>No posts from friends yet. Encourage them to complete tasks!</p>
              </div>
            ) : (
              <PostFeed posts={friendPosts} />
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

