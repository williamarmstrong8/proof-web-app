import { useState } from 'react'
import { PostModal } from './PostModal'
import type { SocialPost } from '../lib/WebsiteContext'
import './PostGrid.css'

interface Post {
  id: string
  image: string
  date: string
  task_title?: string
  caption?: string | null
}

interface PostGridProps {
  posts: Post[]
  user?: {
    id?: string
    name: string
    username: string
    avatar: string
  }
}

export function PostGrid({ posts, user }: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatDate = (dateString: string) => {
    // Handle date-only strings (YYYY-MM-DD) without timezone conversion
    // If it's already a date string, parse it directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // It's a date-only string (from completed_on), parse it as local date
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    // Otherwise, it's a timestamp, parse normally
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const calculateTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handlePostClick = (post: Post) => {
    if (!user) return

    // Convert Post to SocialPost format for the modal
    const socialPost: SocialPost = {
      id: post.id,
      user: {
        id: user.id || '',
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      },
      task: post.task_title || 'Task',
      proofImage: post.image,
      timestamp: calculateTimestamp(post.date),
      likes: 0,
      comments: 0,
    }

    setSelectedPost(socialPost)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPost(null)
  }

  return (
    <>
    <div className="post-grid-section">
      <h2 className="post-grid-title">Posts</h2>
      <div className="post-grid">
        {posts.map((post) => (
            <div 
              key={post.id} 
              className="post-item"
              onClick={() => handlePostClick(post)}
              style={{ cursor: 'pointer' }}
            >
            <div className="post-image-container">
              <img 
                src={post.image} 
                alt={`Post from ${formatDate(post.date)}`}
                className="post-image"
                loading="lazy"
              />
              <div className="post-overlay">
                <span className="post-date">{formatDate(post.date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

