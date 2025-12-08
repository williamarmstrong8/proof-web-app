import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Search } from 'lucide-react'
import './AddFriendsPage.css'

interface SuggestedUser {
  id: string
  name: string
  username: string
  avatar: string
  mutualFriends: number
  isFriend: boolean
}

export function AddFriendsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Mock suggested users
  const suggestedUsers: SuggestedUser[] = [
    {
      id: '1',
      name: 'Jordan Smith',
      username: '@jordans',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 3,
      isFriend: false,
    },
    {
      id: '2',
      name: 'Taylor Brown',
      username: '@taylorb',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 5,
      isFriend: false,
    },
    {
      id: '3',
      name: 'Morgan Lee',
      username: '@morganl',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 2,
      isFriend: false,
    },
    {
      id: '4',
      name: 'Casey Davis',
      username: '@caseyd',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 4,
      isFriend: false,
    },
    {
      id: '5',
      name: 'Riley Wilson',
      username: '@rileyw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 1,
      isFriend: false,
    },
  ]

  const [users, setUsers] = useState(suggestedUsers)

  const handleAddFriend = (userId: string) => {
    // TODO: Implement add friend functionality
    console.log('Add friend:', userId)
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isFriend: true } : user
    ))
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="add-friends-page">
      <div className="add-friends-content">
        <div className="add-friends-header">
          <button className="add-friends-back-button" onClick={() => navigate('/social')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="add-friends-title">Add Friends</h1>
          <div style={{ width: 24 }} />
        </div>

        <div className="add-friends-search">
          <div className="add-friends-search-container">
            <Search className="add-friends-search-icon" size={20} />
            <input
              type="text"
              className="add-friends-search-input"
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="add-friends-section">
          <h2 className="add-friends-section-title">Suggested</h2>
          <div className="add-friends-list">
            {filteredUsers.map((user) => (
              <div key={user.id} className="add-friends-user-card">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="add-friends-user-avatar"
                />
                <div className="add-friends-user-info">
                  <div className="add-friends-user-name-row">
                    <span className="add-friends-user-name">{user.name}</span>
                  </div>
                  <span className="add-friends-user-username">{user.username}</span>
                  <span className="add-friends-mutual-friends">
                    {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  className={`add-friends-add-button ${user.isFriend ? 'add-friends-add-button-added' : ''}`}
                  onClick={() => handleAddFriend(user.id)}
                  disabled={user.isFriend}
                >
                  {user.isFriend ? (
                    <>
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

