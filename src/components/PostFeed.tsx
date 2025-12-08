import { PostCard } from './PostCard'
import './PostFeed.css'

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

interface PostFeedProps {
  posts: Post[]
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

