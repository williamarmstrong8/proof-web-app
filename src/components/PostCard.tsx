import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Verified, UserPlus } from 'lucide-react'
import { useWebsite, type SocialPost } from '../lib/WebsiteContext'
import { useState } from 'react'
import './PostCard.css'

interface PostCardProps {
  post: SocialPost
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate()
  const { sendFriendRequest, getFriendshipStatus, profile } = useWebsite()
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const isMock = post.id.startsWith('mock-')

  const handleLike = () => {
    // TODO: Add like functionality
    console.log('Like post:', post.id)
  }

  const handleComment = () => {
    // TODO: Add comment functionality
    console.log('Comment on post:', post.id)
  }

  const handleUserClick = () => {
    if (isMock) return // Don't navigate for mock posts
    // Extract username from @username format
    const username = post.user.username.replace('@', '')
    navigate(`/user/${username}`)
  }

  const handlePartnerClick = () => {
    if (!post.partner) return
    // Extract username from @username format
    const username = post.partner.username.replace('@', '')
    navigate(`/user/${username}`)
  }

  const handleAddPartnerFriend = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!post.partner?.id) return

    setIsAddingFriend(true)
    const result = await sendFriendRequest(post.partner.id)
    if (result.error) {
      alert(`Error: ${result.error.message}`)
    }
    setIsAddingFriend(false)
  }

  // Check friendship status with partner (if partner exists)
  // Also check if partner is the current user (don't show add button for self)
  const partnerFriendshipStatus = post.partner?.id ? getFriendshipStatus(post.partner.id) : null
  const isPartnerSelf = post.partner?.id === profile?.id
  const showAddFriendButton = post.partner && partnerFriendshipStatus === 'none' && !isPartnerSelf

  return (
    <article className="post-card" style={{ position: 'relative', opacity: isMock ? 0.7 : 1 }}>
      {isMock && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '4px 8px',
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
      <div className="post-card-header">
        <div className="post-user-info" onClick={handleUserClick} style={{ cursor: isMock ? 'default' : 'pointer' }}>
          <img 
            src={post.user.avatar} 
            alt={post.user.name}
            className="post-user-avatar"
          />
          <div className="post-user-details">
            <div className="post-user-name-row">
              <span className="post-user-name">{post.user.name}</span>
              <Verified className="post-verified-icon" size={16} />
            </div>
            <span className="post-user-username">{post.user.username}</span>
          </div>
        </div>
        <span className="post-timestamp">{post.timestamp}</span>
      </div>

      <div className="post-task-badge">
        <span className="post-task-label">Completed:</span>
        <span className="post-task-name">{post.task}</span>
      </div>

      {/* Partner info for partner task posts */}
      {post.partner && (
        <div className="post-partner-info">
          <div className="post-partner-label">Partner:</div>
          <div 
            className="post-partner-user"
            onClick={handlePartnerClick}
            style={{ cursor: 'pointer' }}
          >
            <span className="post-partner-username">{post.partner.username}</span>
          </div>
          {showAddFriendButton && (
            <button
              className="post-add-friend-button"
              onClick={handleAddPartnerFriend}
              disabled={isAddingFriend}
              aria-label="Add friend"
            >
              <UserPlus size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
      )}

      <div className="post-image-container">
        <img 
          src={post.proofImage} 
          alt={`Proof of ${post.task}`}
          className="post-image"
          loading="lazy"
        />
        <div className="post-proof-overlay">
          <Verified className="post-proof-icon" size={24} />
          <span className="post-proof-text">Proof Submitted</span>
        </div>
      </div>

      <div className="post-actions">
        <button 
          className="post-action-button"
          onClick={handleLike}
          aria-label="Like post"
        >
          <Heart className="post-action-icon" size={20} />
          <span className="post-action-count">{post.likes}</span>
        </button>
        <button 
          className="post-action-button"
          onClick={handleComment}
          aria-label="Comment on post"
        >
          <MessageCircle className="post-action-icon" size={20} />
          <span className="post-action-count">{post.comments}</span>
        </button>
      </div>
    </article>
  )
}

