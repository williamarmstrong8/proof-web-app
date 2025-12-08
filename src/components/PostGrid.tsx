import './PostGrid.css'

interface Post {
  id: string
  image: string
  date: string
}

interface PostGridProps {
  posts: Post[]
}

export function PostGrid({ posts }: PostGridProps) {
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

  return (
    <div className="post-grid-section">
      <h2 className="post-grid-title">Posts</h2>
      <div className="post-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
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
  )
}

