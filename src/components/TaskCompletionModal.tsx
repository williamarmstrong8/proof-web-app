import { useState, useRef } from 'react'
import { X, Camera, Upload } from 'lucide-react'
import './TaskCompletionModal.css'

interface TaskCompletionModalProps {
  isOpen: boolean
  taskTitle: string
  isSubmitting?: boolean
  onClose: () => void
  onComplete: (photo: File, caption?: string) => void
}

export function TaskCompletionModal({ isOpen, taskTitle, isSubmitting, onClose, onComplete }: TaskCompletionModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleOptionClick = (option: 'camera' | 'upload') => {
    if (option === 'upload') {
      fileInputRef.current?.click()
    } else if (option === 'camera') {
      cameraInputRef.current?.click()
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = () => {
    if (!selectedFile || !selectedImage) {
      alert('Please upload a photo to complete the task')
      return
    }
    onComplete(selectedFile, caption.trim() || undefined)
  }

  const handleClose = () => {
    if (isSubmitting) return // Prevent closing while submitting
    setSelectedImage(null)
    setSelectedFile(null)
    setCaption('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    onClose()
  }

  return (
    <div className="task-completion-modal-overlay" onClick={handleClose}>
      <div className="task-completion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-completion-modal-header">
          <h2 className="task-completion-modal-title">Complete Task</h2>
          <button className="task-completion-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="task-completion-modal-content">
          <div className="task-completion-task-name">
            <span className="task-completion-label">Task:</span>
            <span className="task-completion-name">{taskTitle}</span>
          </div>

          {!selectedImage ? (
            <div className="task-completion-image-options">
              <p className="task-completion-instruction">Upload photo proof (required)</p>
              <div className="task-completion-options-grid">
                <div className="task-completion-option-card" onClick={() => handleOptionClick('camera')}>
                  <Camera size={48} />
                  <span className="task-completion-option-title">Take Photo</span>
                  <span className="task-completion-option-description">Capture a new moment</span>
                </div>
                <div className="task-completion-option-card" onClick={() => handleOptionClick('upload')}>
                  <Upload size={48} />
                  <span className="task-completion-option-title">Upload File</span>
                  <span className="task-completion-option-description">Choose from your device</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="task-completion-image-preview-container">
              <img src={selectedImage} alt="Selected for task completion" className="task-completion-image-preview" />
              <button className="task-completion-remove-image-button" onClick={handleRemoveImage}>
                <X size={20} />
              </button>
            </div>
          )}

          <div className="task-completion-caption-section">
            <label htmlFor="task-caption" className="task-completion-caption-label">
              Caption (Optional)
            </label>
            <textarea
              id="task-caption"
              className="task-completion-caption-input"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption to your proof..."
            />
          </div>
        </div>

        <div className="task-completion-modal-actions">
          <button 
            className="task-completion-button task-completion-button-cancel" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="task-completion-button task-completion-button-submit"
            onClick={handleSubmit}
            disabled={!selectedImage || isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : 'Complete Task'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple={false}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

