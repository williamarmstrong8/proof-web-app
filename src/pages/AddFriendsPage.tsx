import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Search, X, Check, Clock } from 'lucide-react'
import { useWebsite } from '../lib/WebsiteContext'
import type { Profile } from '../lib/WebsiteContext'
import './AddFriendsPage.css'

type FriendshipStatus = 'none' | 'outgoing' | 'incoming' | 'friends'

interface UserWithStatus extends Profile {
  friendshipStatus: FriendshipStatus
}

export function AddFriendsPage() {
  const navigate = useNavigate()
  const { 
    searchUsers, 
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    unfriendOrCancel,
    friends,
    incomingRequests,
    outgoingRequests,
  } = useWebsite()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('[AddFriendsPage] Friendship data:', {
      friends: friends.length,
      incomingRequests: incomingRequests.length,
      outgoingRequests: outgoingRequests.length,
      incomingRequestsData: incomingRequests,
    })
  }, [friends, incomingRequests, outgoingRequests])

  // Search for users as the query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      const result = await searchUsers(searchQuery)
      
      if (!result.error && result.data) {
        setSearchResults(result.data)
      }
      setIsSearching(false)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  // Combine search results with their friendship status
  const usersWithStatus: UserWithStatus[] = useMemo(() => {
    return searchResults.map(user => ({
      ...user,
      friendshipStatus: getFriendshipStatus(user.id)
    }))
  }, [searchResults, getFriendshipStatus])

  // Handle sending a friend request
  const handleSendRequest = async (userId: string) => {
    setActionInProgress(userId)
    const result = await sendFriendRequest(userId)
    
    if (result.error) {
      alert(`Error: ${result.error.message}`)
    }
    
    setActionInProgress(null)
  }

  // Handle accepting a friend request
  const handleAcceptRequest = async (userId: string) => {
    setActionInProgress(userId)
    const result = await acceptFriendRequest(userId)
    
    if (result.error) {
      alert(`Error: ${result.error.message}`)
    }
    
    setActionInProgress(null)
  }

  // Handle unfriending or canceling a request
  const handleUnfriendOrCancel = async (userId: string) => {
    if (!confirm('Are you sure you want to unfriend or cancel this request?')) {
      return
    }

    setActionInProgress(userId)
    const result = await unfriendOrCancel(userId)
    
    if (result.error) {
      alert(`Error: ${result.error.message}`)
    }
    
    setActionInProgress(null)
  }

  // Render the appropriate button based on friendship status
  const renderActionButton = (user: UserWithStatus) => {
    const isLoading = actionInProgress === user.id

    switch (user.friendshipStatus) {
      case 'friends':
        return (
          <button
            className="add-friends-add-button add-friends-add-button-friends"
            onClick={() => handleUnfriendOrCancel(user.id)}
            disabled={isLoading}
          >
            <Check size={16} />
            <span>Friends</span>
          </button>
        )

      case 'outgoing':
        return (
          <button
            className="add-friends-add-button add-friends-add-button-requested"
            onClick={() => handleUnfriendOrCancel(user.id)}
            disabled={isLoading}
          >
            <Clock size={16} />
            <span>Requested</span>
          </button>
        )

      case 'incoming':
        return (
          <button
            className="add-friends-add-button add-friends-add-button-accept"
            onClick={() => handleAcceptRequest(user.id)}
            disabled={isLoading}
          >
            <UserPlus size={16} />
            <span>Accept</span>
          </button>
        )

      case 'none':
      default:
        return (
          <button
            className="add-friends-add-button"
            onClick={() => handleSendRequest(user.id)}
            disabled={isLoading}
          >
            <UserPlus size={16} />
            <span>Add</span>
          </button>
        )
    }
  }

  // Get display name for user
  const getDisplayName = (user: Profile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.username || user.email || 'Unknown User'
  }

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
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="add-friends-search-clear"
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Incoming Friend Requests Section - Always show at top if there are any */}
        {incomingRequests.length > 0 && (
        <div className="add-friends-section">
            <h2 className="add-friends-section-title">
              Friend Requests ({incomingRequests.length})
            </h2>
          <div className="add-friends-list">
              {incomingRequests.map((request) => {
                const user = request.profile
                return (
              <div key={user.id} className="add-friends-user-card">
                <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`} 
                      alt={getDisplayName(user)}
                  className="add-friends-user-avatar"
                />
                <div className="add-friends-user-info">
                  <div className="add-friends-user-name-row">
                        <span className="add-friends-user-name">{getDisplayName(user)}</span>
                  </div>
                      <span className="add-friends-user-username">@{user.username || 'no-username'}</span>
                      {user.caption && (
                        <span className="add-friends-user-caption">{user.caption}</span>
                      )}
                </div>
                <button
                      className="add-friends-add-button add-friends-add-button-accept"
                      onClick={() => handleAcceptRequest(user.id)}
                      disabled={actionInProgress === user.id}
                >
                      <UserPlus size={16} />
                      <span>Accept</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Outgoing Friend Requests Section - Show requests you've sent */}
        {outgoingRequests.length > 0 && (
          <div className="add-friends-section">
            <h2 className="add-friends-section-title">
              Sent Requests ({outgoingRequests.length})
            </h2>
            <div className="add-friends-list">
              {outgoingRequests.map((request) => {
                const user = request.profile
                return (
                  <div key={user.id} className="add-friends-user-card">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`} 
                      alt={getDisplayName(user)}
                      className="add-friends-user-avatar"
                    />
                    <div className="add-friends-user-info">
                      <div className="add-friends-user-name-row">
                        <span className="add-friends-user-name">{getDisplayName(user)}</span>
                      </div>
                      <span className="add-friends-user-username">@{user.username || 'no-username'}</span>
                      {user.caption && (
                        <span className="add-friends-user-caption">{user.caption}</span>
                      )}
                    </div>
                    <button
                      className="add-friends-add-button add-friends-add-button-requested"
                      onClick={() => handleUnfriendOrCancel(user.id)}
                      disabled={actionInProgress === user.id}
                    >
                      <Clock size={16} />
                      <span>Requested</span>
                </button>
              </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search Results Section */}
        {searchQuery.trim().length >= 2 && (
          <div className="add-friends-section">
            <h2 className="add-friends-section-title">
              {isSearching ? 'Searching...' : `Search Results (${usersWithStatus.length})`}
            </h2>
            
            {!isSearching && usersWithStatus.length === 0 && (
              <div className="add-friends-empty">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}

            {usersWithStatus.length > 0 && (
              <div className="add-friends-list">
                {usersWithStatus.map((user) => (
                  <div key={user.id} className="add-friends-user-card">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`} 
                      alt={getDisplayName(user)}
                      className="add-friends-user-avatar"
                    />
                    <div className="add-friends-user-info">
                      <div className="add-friends-user-name-row">
                        <span className="add-friends-user-name">{getDisplayName(user)}</span>
                      </div>
                      <span className="add-friends-user-username">@{user.username || 'no-username'}</span>
                      {user.caption && (
                        <span className="add-friends-user-caption">{user.caption}</span>
                      )}
                    </div>
                    {renderActionButton(user)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Friends Section */}
        {!searchQuery && friends.length > 0 && (
          <div className="add-friends-section">
            <h2 className="add-friends-section-title">
              Your Friends ({friends.length})
            </h2>
            <div className="add-friends-list">
              {friends.map((friendship) => {
                const user = friendship.profile
                return (
                  <div key={user.id} className="add-friends-user-card">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`} 
                      alt={getDisplayName(user)}
                      className="add-friends-user-avatar"
                    />
                    <div className="add-friends-user-info">
                      <div className="add-friends-user-name-row">
                        <span className="add-friends-user-name">{getDisplayName(user)}</span>
                      </div>
                      <span className="add-friends-user-username">@{user.username || 'no-username'}</span>
                      {user.caption && (
                        <span className="add-friends-user-caption">{user.caption}</span>
                      )}
                    </div>
                    <button
                      className="add-friends-add-button add-friends-add-button-friends"
                      onClick={() => handleUnfriendOrCancel(user.id)}
                      disabled={actionInProgress === user.id}
                    >
                      <Check size={16} />
                      <span>Friends</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state when no friends and no search */}
        {!searchQuery && friends.length === 0 && incomingRequests.length === 0 && (
          <div className="add-friends-empty">
            <p>Search for users above to start adding friends!</p>
        </div>
        )}
      </div>
    </div>
  )
}

