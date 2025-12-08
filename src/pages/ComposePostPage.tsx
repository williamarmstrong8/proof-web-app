import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './ComposePostPage.css'

export function ComposePostPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const image = location.state?.image

  const handleCancel = () => {
    navigate(-1)
  }

  const handlePublish = () => {
    // TODO: Implement publish functionality
    console.log('Publish post with image:', image)
    navigate('/social')
  }

  return (
    <div className="compose-post-page">
      <div className="compose-post-header">
        <button className="compose-post-back-button" onClick={handleCancel}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="compose-post-title">Compose Post</h1>
        <button className="compose-post-publish-button" onClick={handlePublish}>
          Publish
        </button>
      </div>

      <div className="compose-post-content">
        {image && (
          <div className="compose-post-image-container">
            <img src={image} alt="Post preview" className="compose-post-image" />
          </div>
        )}
        
        <div className="compose-post-form">
          <label htmlFor="task" className="compose-post-label">
            What task did you complete?
          </label>
          <input
            type="text"
            id="task"
            className="compose-post-input"
            placeholder="e.g., Morning Run, Meditation, Reading..."
          />

          <label htmlFor="description" className="compose-post-label">
            Add a description (optional)
          </label>
          <textarea
            id="description"
            className="compose-post-textarea"
            placeholder="Share your experience..."
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}

