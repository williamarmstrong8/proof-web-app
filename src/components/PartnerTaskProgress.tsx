import { useEffect } from 'react'
import type { PartnerTask } from '../lib/partnerTasks'
import type { Profile } from '../lib/WebsiteContext'
import './PartnerTaskProgress.css'

interface PartnerTaskProgressProps {
  partnerTask: PartnerTask & {
    completed_today?: boolean
    partner_completed_today?: boolean
  }
  currentUserId: string
  date?: string // Defaults to today (not used if status passed from context)
  onStatusUpdate?: (currentUserCompleted: boolean) => void
  refreshKey?: number // Not needed if using context data
  partnerName?: string // Display name of the partner
  currentUserProfile?: Profile | null
  otherUserProfile?: {
    id: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  } | null
  showProgressBarOnly?: boolean // If true, only show progress bar (for standalone below)
  showAvatarsOnly?: boolean // If true, only show avatars (for header row)
}

export function PartnerTaskProgress({
  partnerTask,
  currentUserId: _currentUserId,
  date: _date,
  onStatusUpdate,
  refreshKey: _refreshKey,
  partnerName: _partnerName = 'Partner',
  currentUserProfile,
  otherUserProfile,
  showProgressBarOnly = false,
  showAvatarsOnly = false,
}: PartnerTaskProgressProps) {
  // Use completion status from WebsiteContext (no API call needed)
  const currentUserCompleted = partnerTask.completed_today || false
  const partnerCompleted = partnerTask.partner_completed_today || false

  // Notify parent when status is available
  useEffect(() => {
    if (onStatusUpdate) {
      onStatusUpdate(currentUserCompleted)
    }
  }, [currentUserCompleted, onStatusUpdate])

  // Calculate progress percentage: 0%, 50%, or 100%
  const completedCount = 
    (currentUserCompleted ? 1 : 0) + 
    (partnerCompleted ? 1 : 0)
  const progressPercentage = (completedCount / 2) * 100

  // Don't render if task is not accepted
  if (partnerTask.status !== 'accepted') {
    return null
  }

  // Get initials for current user
  const getCurrentUserInitials = () => {
    if (currentUserProfile?.first_name && currentUserProfile?.last_name) {
      return `${currentUserProfile.first_name[0]}${currentUserProfile.last_name[0]}`.toUpperCase()
    }
    if (currentUserProfile?.username) {
      return currentUserProfile.username.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Get initials for other user
  const getOtherUserInitials = () => {
    if (otherUserProfile?.first_name && otherUserProfile?.last_name) {
      return `${otherUserProfile.first_name[0]}${otherUserProfile.last_name[0]}`.toUpperCase()
    }
    if (otherUserProfile?.username) {
      return otherUserProfile.username.substring(0, 2).toUpperCase()
    }
    return 'P'
  }

  // If only showing progress bar, return just that
  if (showProgressBarOnly) {
    return (
      <div className="partner-progress-bar-standalone">
        <div 
          className="partner-progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    )
  }

  // If only showing avatars (for header row)
  if (showAvatarsOnly) {
    return (
      <div className="partner-avatars">
        <div className={`partner-avatar ${currentUserCompleted ? 'partner-avatar-completed' : ''}`}>
          {getCurrentUserInitials()}
        </div>
        <div className={`partner-avatar ${partnerCompleted ? 'partner-avatar-completed' : ''}`}>
          {getOtherUserInitials()}
        </div>
      </div>
    )
  }

  // Default: show both (for backwards compatibility, though we shouldn't use this)
  return (
    <div className="partner-progress-simple">
      <div className="partner-avatars">
        <div className={`partner-avatar ${currentUserCompleted ? 'partner-avatar-completed' : ''}`}>
          {getCurrentUserInitials()}
        </div>
        <div className={`partner-avatar ${partnerCompleted ? 'partner-avatar-completed' : ''}`}>
          {getOtherUserInitials()}
        </div>
      </div>
      <div className="partner-progress-bar-standalone">
        <div 
          className="partner-progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}
