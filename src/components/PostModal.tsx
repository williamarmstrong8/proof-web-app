import { useEffect, useRef } from 'react'
import { X, Heart, MessageCircle, Verified } from 'lucide-react'
import type { SocialPost } from '../lib/WebsiteContext'
import './PostModal.css'

interface PostModalProps {
  post: SocialPost | null
  isOpen: boolean
  onClose: () => void
}

export function PostModal({ post, isOpen, onClose }: PostModalProps) {
  const scrollPositionRef = useRef<number>(0)

  // Close modal on escape key and manage scroll position
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
      
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open, but maintain scroll position
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
    } else {
      // Restore scroll position when modal closes
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      // Restore scroll position after styles are reset
      window.scrollTo(0, scrollPositionRef.current)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Cleanup: restore scroll if component unmounts while open
      if (isOpen) {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollPositionRef.current)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !post) {
    return null
  }

  const handleLike = () => {
    // TODO: Add like functionality
    console.log('Like post:', post.id)
  }

  const handleComment = () => {
    // TODO: Add comment functionality
    console.log('Comment on post:', post.id)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="post-modal-overlay" onClick={handleBackdropClick}>
      <div className="post-modal-container">
        <button
          className="post-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <article className="post-modal-card">
          <div className="post-card-header">
            <div className="post-user-info" style={{ cursor: 'pointer' }}>
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
              <div className="post-partner-user">
                <span className="post-partner-username">{post.partner.username}</span>
              </div>
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
      </div>
    </div>
  )
}
