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
  return (
    <aside className="friends-sidebar">
      <h2 className="friends-sidebar-title">Friends ({friends.length})</h2>
      {friends.length === 0 ? (
        <div className="friends-empty">
          <p>No friends yet</p>
          <p className="friends-empty-hint">Add friends to see them here</p>
        </div>
      ) : (
      <div className="friends-list">
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </div>
      )}
    </aside>
  )
}

