import { MoreVertical, Clock } from 'lucide-react'
import { PartnerTaskProgress } from './PartnerTaskProgress'
import type { PartnerTask as PartnerTaskType } from '../lib/partnerTasks'
type ExtendedPartnerTask = PartnerTaskType & {
  completed_today?: boolean
  partner_completed_today?: boolean
  other_user_name?: string
  other_user_profile?: {
    id: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  } | null
}
import { useWebsite } from '../lib/WebsiteContext'
import { useState } from 'react'
import './Task.css'

interface PartnerTaskProps {
  partnerTask: ExtendedPartnerTask
  onComplete?: () => void
  onUncomplete?: () => void
  onEdit?: () => void
  refreshKey?: number // Pass through to PartnerTaskProgress
}

export function PartnerTask({
  partnerTask,
  onComplete,
  onUncomplete,
  onEdit,
  refreshKey,
}: PartnerTaskProps) {
  const { profile } = useWebsite()
  const [loadingStatus, setLoadingStatus] = useState(true)

  const isCreator = profile?.id === partnerTask.creator_profile_id
  const isPending = partnerTask.status === 'pending'

  // Use other user info from WebsiteContext (already determined and fetched)
  const otherUserName = (partnerTask as any).other_user_name || 'Partner'
  
  // Check completion status from partnerTask data (from WebsiteContext)
  const currentUserCompleted = partnerTask.completed_today || false
  const partnerCompleted = partnerTask.partner_completed_today || false
  const bothCompleted = currentUserCompleted && partnerCompleted

  const handleToggle = () => {
    // Only allow toggling if task is accepted
    if (partnerTask.status !== 'accepted' || loadingStatus) return

    if (!currentUserCompleted && onComplete) {
      onComplete()
      // Status will be refreshed when PartnerTaskProgress updates
    } else if (currentUserCompleted && onUncomplete) {
      onUncomplete()
      // Status will be refreshed when PartnerTaskProgress updates
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  if (!profile?.id) return null

  return (
    <div className={`task task-partner ${isPending ? 'task-pending' : ''} ${bothCompleted && !isPending ? 'task-completed' : ''}`}>
      <button
        className={`task-checkbox ${currentUserCompleted && !isPending ? 'task-checkbox-completed' : ''}`}
        onClick={handleToggle}
        disabled={isPending || loadingStatus}
        aria-label={
          isPending 
            ? 'Task pending acceptance' 
            : `Mark ${partnerTask.title} as ${currentUserCompleted ? 'incomplete' : 'complete'}`
        }
      >
        {currentUserCompleted && !isPending && <span className="task-checkmark">✓</span>}
        {isPending && <span className="task-pending-icon">⏳</span>}
      </button>
      
      <div className="task-content">
        <div className="task-header-row">
          <h3 className="task-title">{partnerTask.title}</h3>
          <span className="task-badge task-badge-partner">Partner</span>
          {isPending && (
            <span className="task-badge task-badge-pending">Pending</span>
          )}
          
          {/* Partner avatars on the right - only show for accepted tasks */}
          {partnerTask.status === 'accepted' && partnerTask.partner_profile_id && (
            <PartnerTaskProgress
              partnerTask={partnerTask}
              currentUserId={profile.id}
              refreshKey={refreshKey}
              partnerName={otherUserName}
              currentUserProfile={profile}
              otherUserProfile={(partnerTask as any).other_user_profile}
              showAvatarsOnly={true}
              onStatusUpdate={() => {
                setLoadingStatus(false)
              }}
            />
          )}
        </div>
        
        {partnerTask.description && (
          <p className="task-description">{partnerTask.description}</p>
        )}
        
        {/* Pending status indicator */}
        {isPending && (
          <div className="partner-task-pending-info">
            {isCreator ? (
              <>
                <Clock size={14} />
                <span>Waiting for {otherUserName} to accept</span>
              </>
            ) : (
              <>
                <Clock size={14} />
                <span>Invited you to a partner task</span>
              </>
            )}
          </div>
        )}
        
        {/* Standalone progress bar - only show for accepted tasks */}
        {partnerTask.status === 'accepted' && partnerTask.partner_profile_id && (
          <PartnerTaskProgress
            partnerTask={partnerTask}
            currentUserId={profile.id}
            refreshKey={refreshKey}
            partnerName={otherUserName}
            currentUserProfile={profile}
            otherUserProfile={(partnerTask as any).other_user_profile}
            showProgressBarOnly={true}
            onStatusUpdate={() => {
              setLoadingStatus(false)
            }}
          />
        )}
      </div>
      
      <div className="task-actions">
        <button
          className="task-menu-button"
          onClick={handleMenuClick}
          aria-label="Edit task"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )
}
