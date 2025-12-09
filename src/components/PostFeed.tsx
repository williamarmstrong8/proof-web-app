import { PostCard } from './PostCard'
import type { SocialPost } from '../lib/WebsiteContext'
import './PostFeed.css'

interface PostFeedProps {
  posts: SocialPost[]
}

export function PostFeed({ posts }: PostFeedProps) {
  return (
    <div className="post-feed">
      <div className="post-feed-container">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

