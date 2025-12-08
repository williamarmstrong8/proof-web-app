import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Image as ImageIcon, X, ArrowLeft } from 'lucide-react'
import './CreatePostPage.css'

export function CreatePostPage() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOptionClick = (option: 'camera' | 'upload' | 'camera-roll') => {
    if (option === 'upload') {
      fileInputRef.current?.click()
    } else if (option === 'camera') {
      cameraInputRef.current?.click()
    } else if (option === 'camera-roll') {
      // TODO: Implement camera roll view
      fileInputRef.current?.click()
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleNext = () => {
    if (selectedImage) {
      // TODO: Navigate to post details/compose page
      console.log('Proceed with image:', selectedImage)
      navigate('/compose-post', { state: { image: selectedImage } })
    }
  }

  return (
    <div className="create-post-page">
      <div className="create-post-header">
        <button className="create-post-back-button" onClick={handleCancel}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="create-post-title">Create Post</h1>
        {selectedImage && (
          <button className="create-post-next-button" onClick={handleNext}>
            Next
          </button>
        )}
        {!selectedImage && <div style={{ width: 24 }} />}
      </div>

      <div className="create-post-content">
        {!selectedImage ? (
          <div className="create-post-options">
            <button
              className="create-post-option"
              onClick={() => handleOptionClick('camera')}
            >
              <Camera className="create-post-option-icon" size={48} />
              <span className="create-post-option-label">Take Photo</span>
              <span className="create-post-option-description">Use your camera to capture proof</span>
            </button>

            <button
              className="create-post-option"
              onClick={() => handleOptionClick('upload')}
            >
              <Upload className="create-post-option-icon" size={48} />
              <span className="create-post-option-label">Upload File</span>
              <span className="create-post-option-description">Choose an image from your device</span>
            </button>

            <button
              className="create-post-option"
              onClick={() => handleOptionClick('camera-roll')}
            >
              <ImageIcon className="create-post-option-icon" size={48} />
              <span className="create-post-option-label">Camera Roll</span>
              <span className="create-post-option-description">Select from your recent photos</span>
            </button>
          </div>
        ) : (
          <div className="create-post-preview">
            <div className="create-post-image-container">
              <img src={selectedImage} alt="Selected" className="create-post-image" />
              <button className="create-post-remove-button" onClick={handleRemoveImage}>
                <X size={20} />
              </button>
            </div>
            <p className="create-post-preview-text">Image selected. Click Next to continue.</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

