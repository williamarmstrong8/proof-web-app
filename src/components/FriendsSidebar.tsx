import { FriendCard } from './FriendCard'
import './FriendsSidebar.css'

interface Friend {
  id: string
  name: string
  username: string
  avatar: string
  streak: number
  isOnline?: boolean
}

interface FriendsSidebarProps {
  friends: Friend[]
}

export function FriendsSidebar({ friends }: FriendsSidebarProps) {
  const isMockFriend = (id: string) => id.startsWith('mock-')
  
  return (
    <aside className="friends-sidebar">
      <h2 className="friends-sidebar-title">Friends ({friends.filter(f => !isMockFriend(f.id)).length})</h2>
      {friends.length === 0 ? (
        <div className="friends-empty">
          <p>No friends yet</p>
          <p className="friends-empty-hint">Add friends to see them here</p>
        </div>
      ) : (
      <div className="friends-list">
        {friends.map((friend) => (
          <div key={friend.id} style={{ position: 'relative' }}>
            <FriendCard friend={friend} />
            {isMockFriend(friend.id) && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                Example
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </aside>
  )
}

