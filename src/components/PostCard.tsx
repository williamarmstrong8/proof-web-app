import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Verified } from 'lucide-react'
import './PostCard.css'

interface User {
  name: string
  username: string
  avatar: string
}

interface Post {
  id: string
  user: User
  task: string
  proofImage: string
  timestamp: string
  likes: number
  comments: number
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate()

  const handleLike = () => {
    // TODO: Add like functionality
    console.log('Like post:', post.id)
  }

  const handleComment = () => {
    // TODO: Add comment functionality
    console.log('Comment on post:', post.id)
  }

  const handleUserClick = () => {
    // Extract username from @username format
    const username = post.user.username.replace('@', '')
    navigate(`/user/${username}`)
  }

  return (
    <article className="post-card">
      <div className="post-card-header">
        <div className="post-user-info" onClick={handleUserClick} style={{ cursor: 'pointer' }}>
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

