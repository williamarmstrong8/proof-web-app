import { useState } from 'react'
import { X, Plus, Users, Search } from 'lucide-react'
import { useWebsite } from '../lib/WebsiteContext'
import './AddTaskModal.css'

interface AddTaskModalProps {
  isOpen: boolean
  isCreating?: boolean
  onClose: () => void
  onAddTask: (task: { title: string; isGroup: boolean; groupName?: string }) => void
  onAddPartnerTask?: (task: { title: string; description?: string; partnerId: string }) => void
}

export function AddTaskModal({ isOpen, isCreating, onClose, onAddTask, onAddPartnerTask }: AddTaskModalProps) {
  const { friends } = useWebsite()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskType, setTaskType] = useState<'individual' | 'partner'>('individual')
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('')

  if (!isOpen) return null

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => {
    const name = `${friend.profile.first_name} ${friend.profile.last_name}`.toLowerCase()
    const username = friend.profile.username.toLowerCase()
    const query = partnerSearchQuery.toLowerCase()
    return name.includes(query) || username.includes(query)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    if (taskType === 'partner') {
      if (!selectedPartnerId) {
        alert('Please select a friend for the partner task')
        return
      }
      if (onAddPartnerTask) {
        onAddPartnerTask({
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          partnerId: selectedPartnerId,
        })
        handleReset()
      }
    } else {
      onAddTask({
        title: taskTitle.trim(),
        isGroup: false,
      })
      handleReset()
    }
  }

  const handleReset = () => {
    setTaskTitle('')
    setTaskDescription('')
    setTaskType('individual')
    setSelectedPartnerId('')
    setPartnerSearchQuery('')
  }

  const handleClose = () => {
    if (isCreating) return // Prevent closing while creating
    handleReset()
    onClose()
  }

  return (
    <div className="add-task-modal-overlay" onClick={handleClose}>
      <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-task-modal-header">
          <h2 className="add-task-modal-title">Add New Task</h2>
          <button className="add-task-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form id="add-task-form" className="add-task-modal-form" onSubmit={handleSubmit}>
          <div className="add-task-form-group">
            <label htmlFor="task-title" className="add-task-label">
              Task Name
            </label>
            <input
              type="text"
              id="task-title"
              className="add-task-input"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Morning Run, Read for 30 minutes..."
              required
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div className="add-task-form-group">
            <label htmlFor="task-description" className="add-task-label">
              Description (Optional)
            </label>
            <textarea
              id="task-description"
              className="add-task-input add-task-textarea"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add details about the task..."
              rows={3}
              disabled={isCreating}
            />
          </div>

          <div className="add-task-form-group">
            <label className="add-task-label">Task Type</label>
            <div className="add-task-type-options">
              <button
                type="button"
                className={`add-task-type-option ${taskType === 'individual' ? 'active' : ''}`}
                onClick={() => setTaskType('individual')}
                disabled={isCreating}
              >
                Individual
              </button>
              <button
                type="button"
                className={`add-task-type-option ${taskType === 'partner' ? 'active' : ''}`}
                onClick={() => setTaskType('partner')}
                disabled={isCreating}
              >
                <Users size={16} />
                Partner Task
              </button>
            </div>
          </div>

          {taskType === 'partner' && (
            <div className="add-task-form-group">
              <label htmlFor="partner-search" className="add-task-label">
                Select Friend
              </label>
              <div className="add-task-partner-search-wrapper">
                <Search size={18} className="add-task-search-icon" />
              <input
                type="text"
                  id="partner-search"
                  className="add-task-input add-task-partner-search"
                  value={partnerSearchQuery}
                  onChange={(e) => setPartnerSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                disabled={isCreating}
              />
              </div>
              
              {friends.length === 0 && (
                <div className="add-task-empty-state">
                  <p>You don't have any friends yet. Add friends to create partner tasks!</p>
                </div>
              )}

              {friends.length > 0 && (
                <div className="add-task-partner-list">
                  {filteredFriends.length === 0 ? (
                    <div className="add-task-empty-state">
                      <p>No friends found matching "{partnerSearchQuery}"</p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <button
                        key={friend.profile.id}
                        type="button"
                        className={`add-task-partner-item ${selectedPartnerId === friend.profile.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPartnerId(friend.profile.id)}
                        disabled={isCreating}
                      >
                        <div className="add-task-partner-avatar">
                          {friend.profile.avatar_url ? (
                            <img src={friend.profile.avatar_url} alt={friend.profile.username} />
                          ) : (
                            <div className="add-task-partner-avatar-placeholder">
                              {friend.profile.first_name?.[0]?.toUpperCase() || friend.profile.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="add-task-partner-info">
                          <div className="add-task-partner-name">
                            {friend.profile.first_name} {friend.profile.last_name}
                          </div>
                          <div className="add-task-partner-username">@{friend.profile.username}</div>
                        </div>
                        {selectedPartnerId === friend.profile.id && (
                          <div className="add-task-partner-check">✓</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="add-task-modal-actions">
          <button
            type="button"
            className="add-task-button add-task-button-cancel"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-task-form"
            className="add-task-button add-task-button-submit"
            disabled={isCreating || (taskType === 'partner' && !selectedPartnerId)}
          >
            <Plus size={16} />
            {isCreating 
              ? 'Creating...' 
              : taskType === 'partner' 
                ? 'Create Partner Task' 
                : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

