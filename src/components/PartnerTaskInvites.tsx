import { useState } from 'react'
import { Users, Check, X, Clock } from 'lucide-react'
import { useWebsite } from '../lib/WebsiteContext'
import {
  acceptPartnerTaskInvite,
  declinePartnerTaskInvite,
} from '../lib/partnerTasks'
import './PartnerTaskInvites.css'

interface PartnerTaskInvitesProps {
  onInviteAccepted?: () => void
  onInviteDeclined?: () => void
}

export function PartnerTaskInvites({ onInviteAccepted, onInviteDeclined }: PartnerTaskInvitesProps) {
  const { profile, partnerTaskInvites, refetchPartnerTaskInvites, refetchPartnerTasks } = useWebsite()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)

  // Use invites from WebsiteContext (no need to fetch)
  const pendingInvites = partnerTaskInvites || []

  const handleAccept = async (taskId: string) => {
    if (!profile?.id || acceptingId) return

    setAcceptingId(taskId)
    try {
      const { error } = await acceptPartnerTaskInvite(profile.id, taskId)
      if (error) {
        alert('Failed to accept invite: ' + error.message)
        return
      }

      // Refetch invites and partner tasks to update the UI
      await Promise.all([
        refetchPartnerTaskInvites(),
        refetchPartnerTasks(),
      ])
      
      if (onInviteAccepted) {
        onInviteAccepted()
      }
    } catch (err) {
      console.error('Error accepting invite:', err)
      alert('Failed to accept invite')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleDecline = async (taskId: string) => {
    if (!profile?.id || decliningId) return

    const confirmed = window.confirm('Are you sure you want to decline this partner task invite?')
    if (!confirmed) return

    setDecliningId(taskId)
    try {
      const { error } = await declinePartnerTaskInvite(profile.id, taskId)
      if (error) {
        alert('Failed to decline invite: ' + error.message)
        return
      }

      // Refetch invites to update the UI
      await refetchPartnerTaskInvites()
      
      if (onInviteDeclined) {
        onInviteDeclined()
      }
    } catch (err) {
      console.error('Error declining invite:', err)
      alert('Failed to decline invite')
    } finally {
      setDecliningId(null)
    }
  }

  if (pendingInvites.length === 0) {
    return null // Don't show anything if no pending invites for this user
  }

  return (
    <div className="partner-invites-container">
      <div className="partner-invites-header">
        <Users size={18} />
        <h3 className="partner-invites-title">Partner Task Invites</h3>
      </div>
      
      <div className="partner-invites-list">
        {pendingInvites.map((invite) => {
          const creatorName = invite.creator_profile
            ? `${invite.creator_profile.first_name} ${invite.creator_profile.last_name}`.trim() || invite.creator_profile.username
            : 'Unknown User'

          return (
            <div key={invite.id} className="partner-invite-item">
              <div className="partner-invite-content">
                <div className="partner-invite-header">
                  <div className="partner-invite-creator">
                    {invite.creator_profile?.avatar_url ? (
                      <img 
                        src={invite.creator_profile.avatar_url} 
                        alt={creatorName}
                        className="partner-invite-creator-avatar"
                      />
                    ) : (
                      <div className="partner-invite-creator-avatar-placeholder">
                        {creatorName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="partner-invite-creator-name">{creatorName}</span>
                  </div>
                </div>
                <div className="partner-invite-task-title">{invite.title}</div>
                {invite.description && (
                  <div className="partner-invite-task-description">{invite.description}</div>
                )}
                <div className="partner-invite-status">
                  <Clock size={14} />
                  <span>Invited you to a partner task</span>
                </div>
              </div>
              <div className="partner-invite-actions">
                <button
                  className="partner-invite-button partner-invite-button-accept"
                  onClick={() => handleAccept(invite.id)}
                  disabled={acceptingId === invite.id || decliningId !== null}
                >
                  {acceptingId === invite.id ? (
                    'Accepting...'
                  ) : (
                    <>
                      <Check size={16} />
                      Accept
                    </>
                  )}
                </button>
                <button
                  className="partner-invite-button partner-invite-button-cancel"
                  onClick={() => handleDecline(invite.id)}
                  disabled={decliningId === invite.id || acceptingId !== null}
                >
                  {decliningId === invite.id ? (
                    'Declining...'
                  ) : (
                    <X size={16} />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
