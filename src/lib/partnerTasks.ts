/**
 * Partner Tasks Module
 * 
 * Helpers for managing shared daily tasks between two friends.
 * Both users must complete the task each day (with a photo) for it to "count."
 * 
 * Partner Task Flow:
 * 1. User A creates a partner task and invites User B
 *    → partner_profile_id = User B's ID, status = 'pending'
 * 2. User B accepts the invite
 *    → status = 'accepted' (partner_profile_id stays the same)
 * 3. Both users complete the task daily with photos
 *    → Creates rows in partner_task_completions
 */

import { supabase } from './supabase'
import type { Profile } from './WebsiteContext'

export interface PartnerTask {
  id: string
  creator_profile_id: string
  partner_profile_id: string | null
  title: string
  description: string | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface PartnerTaskWithProfiles extends PartnerTask {
  creator_profile: Profile
  partner_profile?: Profile | null
}

export interface PartnerTaskCompletion {
  id: string
  partner_task_id: string
  profile_id: string
  completion_date: string
  photo_url: string
  created_at: string
}

export interface PartnerTaskCompletionWithTask extends PartnerTaskCompletion {
  partner_task: PartnerTask
  profile: Profile
}

/**
/**
 * Create a new partner task and invite a friend.
 * 
 * Creates a partner task with status='pending' and partner_profile_id set to invitee ID.
 * When accepted, status changes to 'accepted' (partner_profile_id stays the same).
 * 
 * @param creatorProfileId - The ID of the user creating the task
 * @param inviteeProfileId - The ID of the user being invited (required)
 * @param title - Task name (e.g., "Daily Walk", "Cold Plunge")
 * @param description - Optional longer description
 * @returns { error, data } - Returns the created partner task or error
 */
export async function createPartnerTaskAndInvite(
  creatorProfileId: string,
  inviteeProfileId: string,
  title: string,
  description?: string
): Promise<{ error: Error | null; data?: PartnerTask }> {
  try {
    console.log('[PartnerTasks] Creating partner task invite:', {
      creatorProfileId,
      inviteeProfileId,
      title,
    })

    // Validate inputs
    if (!creatorProfileId || !title || !inviteeProfileId) {
      return { error: new Error('Creator ID, invitee ID, and title are required') }
    }

    if (creatorProfileId === inviteeProfileId) {
      return { error: new Error('Cannot create partner task with yourself') }
    }

    // Create the partner task with pending status
    // Set partner_profile_id to inviteeProfileId (same ID when accepted, status changes)
    const { data, error } = await supabase
      .from('partner_tasks')
      .insert({
        creator_profile_id: creatorProfileId,
        partner_profile_id: inviteeProfileId, // Store invitee/partner ID here
        status: 'pending',
        title,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[PartnerTasks] Error creating partner task:', error)
      return { error: new Error(error.message) }
    }

    console.log('[PartnerTasks] Partner task invite created successfully:', data.id)
    return {
      error: null,
      data: {
        id: data.id.toString(),
        creator_profile_id: data.creator_profile_id,
        partner_profile_id: data.partner_profile_id,
        title: data.title,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error creating partner task:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to create partner task'),
    }
  }
}

/**
 * Accept a partner task invite.
 * Sets the status to 'accepted' (partner_profile_id already has the invitee ID).
 * 
 * @param inviteeProfileId - The ID of the user accepting the invite
 * @param partnerTaskId - The ID of the partner task to accept
 * @returns { error, data } - Returns the updated partner task or error
 */
export async function acceptPartnerTaskInvite(
  inviteeProfileId: string,
  partnerTaskId: string
): Promise<{ error: Error | null; data?: PartnerTask }> {
  try {
    console.log('[PartnerTasks] Accepting partner task invite:', {
      inviteeProfileId,
      partnerTaskId,
    })

    // First, verify the invite exists and is for this user
    const { data: existingTask, error: fetchError } = await supabase
      .from('partner_tasks')
      .select('*')
      .eq('id', partnerTaskId)
      .eq('status', 'pending')
      .eq('partner_profile_id', inviteeProfileId)
      .single()

    if (fetchError || !existingTask) {
      console.error('[PartnerTasks] Partner task invite not found:', fetchError)
      return { error: new Error('Partner task invite not found or already processed') }
    }

    // Verify the invitee is not the creator
    if (existingTask.creator_profile_id === inviteeProfileId) {
      return { error: new Error('Cannot accept your own partner task invite') }
    }

    // Update status to accept the invite (partner_profile_id already has the invitee ID)
    const { data, error } = await supabase
      .from('partner_tasks')
      .update({ 
        status: 'accepted'
      })
      .eq('id', partnerTaskId)
      .select()
      .single()

    if (error) {
      console.error('[PartnerTasks] Error accepting invite:', error)
      return { error: new Error(error.message) }
    }

    console.log('[PartnerTasks] Partner task invite accepted successfully')
    return {
      error: null,
      data: {
        id: data.id.toString(),
        creator_profile_id: data.creator_profile_id,
        partner_profile_id: data.partner_profile_id,
        title: data.title,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error accepting invite:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to accept invite'),
    }
  }
}

/**
 * Decline a partner task invite.
 * Sets the status to 'declined'.
 * 
 * @param inviteeProfileId - The ID of the user declining the invite
 * @param partnerTaskId - The ID of the partner task to decline
 * @returns { error } - Returns null on success, error otherwise
 */
export async function declinePartnerTaskInvite(
  inviteeProfileId: string,
  partnerTaskId: string
): Promise<{ error: Error | null }> {
  try {
    console.log('[PartnerTasks] Declining partner task invite:', {
      inviteeProfileId,
      partnerTaskId,
    })

    // Verify the invite exists and is for this user
    const { data: existingTask, error: fetchError } = await supabase
      .from('partner_tasks')
      .select('*')
      .eq('id', partnerTaskId)
      .eq('status', 'pending')
      .eq('partner_profile_id', inviteeProfileId)
      .single()

    if (fetchError || !existingTask) {
      console.error('[PartnerTasks] Partner task invite not found:', fetchError)
      return { error: new Error('Partner task invite not found or already processed') }
    }

    // Update status to declined
    const { error } = await supabase
      .from('partner_tasks')
      .update({ status: 'declined' })
      .eq('id', partnerTaskId)

    if (error) {
      console.error('[PartnerTasks] Error declining invite:', error)
      return { error: new Error(error.message) }
    }

    console.log('[PartnerTasks] Partner task invite declined successfully')
    return { error: null }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error declining invite:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to decline invite'),
    }
  }
}

/**
 * Get all partner tasks for a user.
 * Returns both accepted tasks and pending invites (where user is creator).
 * 
 * @param profileId - The profile ID to get tasks for
 * @returns { error, data } - Returns list of partner tasks or error
 */
export async function getPartnerTasksForProfile(
  profileId: string
): Promise<{ error: Error | null; data?: PartnerTask[] }> {
  try {
    console.log('[PartnerTasks] Getting partner tasks for profile:', profileId)

    // Get partner tasks where:
    // - User is creator (includes pending and accepted)
    // - OR user is partner AND status is accepted
    // Filter out declined/cancelled tasks
    const { data, error } = await supabase
      .from('partner_tasks')
      .select('*')
      .in('status', ['pending', 'accepted'])
      .or(`creator_profile_id.eq.${profileId},and(partner_profile_id.eq.${profileId},status.eq.accepted)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[PartnerTasks] Error fetching partner tasks:', error)
      return { error: new Error(error.message) }
    }

    const partnerTasks: PartnerTask[] = (data || []).map((task: any) => ({
      id: task.id.toString(),
      creator_profile_id: task.creator_profile_id,
      partner_profile_id: task.partner_profile_id,
      title: task.title,
      description: task.description,
      status: task.status,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }))

    console.log('[PartnerTasks] Found', partnerTasks.length, 'partner tasks')
    return { error: null, data: partnerTasks }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error getting partner tasks:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to get partner tasks'),
    }
  }
}

/**
 * Get all pending partner task invites for a user.
 * Returns tasks where the user is the invitee (partner_profile_id matches user) and status is 'pending'.
 * 
 * @param profileId - The profile ID to get invites for
 * @returns { error, data } - Returns list of pending invites or error
 */
export async function getPendingPartnerTaskInvites(
  profileId: string
): Promise<{ error: Error | null; data?: PartnerTask[] }> {
  try {
    console.log('[PartnerTasks] Getting pending invites for profile:', profileId)

    const { data, error } = await supabase
      .from('partner_tasks')
      .select('*')
      .eq('partner_profile_id', profileId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[PartnerTasks] Error fetching pending invites:', error)
      return { error: new Error(error.message) }
    }

    const invites: PartnerTask[] = (data || []).map((task: any) => ({
      id: task.id.toString(),
      creator_profile_id: task.creator_profile_id,
      partner_profile_id: task.partner_profile_id,
      title: task.title,
      description: task.description,
      status: task.status,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }))

    console.log('[PartnerTasks] Found', invites.length, 'pending invites')
    return { error: null, data: invites }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error getting pending invites:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to get pending invites'),
    }
  }
}

/**
 * Get all partner task completions for a specific profile and date.
 * Includes the related partner task and partner profile information.
 * 
 * @param profileId - The profile ID to get completions for
 * @param date - The date to get completions for (YYYY-MM-DD format)
 * @returns { error, data } - Returns list of completions or error
 */
export async function getPartnerTaskCompletionsForDate(
  profileId: string,
  date: string
): Promise<{ error: Error | null; data?: PartnerTaskCompletionWithTask[] }> {
  try {
    console.log('[PartnerTasks] Getting completions for profile:', profileId, 'date:', date)

    const { data, error } = await supabase
      .from('partner_task_completions')
      .select(`
        *,
        partner_task:partner_tasks(*),
        profile:profiles(*)
      `)
      .eq('profile_id', profileId)
      .eq('completion_date', date)

    if (error) {
      console.error('[PartnerTasks] Error fetching completions:', error)
      return { error: new Error(error.message) }
    }

    const completions: PartnerTaskCompletionWithTask[] = (data || []).map((comp: any) => ({
      id: comp.id.toString(),
      partner_task_id: comp.partner_task_id.toString(),
      profile_id: comp.profile_id,
      completion_date: comp.completion_date,
      photo_url: comp.photo_url,
      created_at: comp.created_at,
      partner_task: {
        id: comp.partner_task.id.toString(),
        creator_profile_id: comp.partner_task.creator_profile_id,
        partner_profile_id: comp.partner_task.partner_profile_id,
        title: comp.partner_task.title,
        description: comp.partner_task.description,
        status: comp.partner_task.status,
        created_at: comp.partner_task.created_at,
        updated_at: comp.partner_task.updated_at,
      },
      profile: comp.profile,
    }))

    console.log('[PartnerTasks] Found', completions.length, 'completions')
    return { error: null, data: completions }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error getting completions:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to get completions'),
    }
  }
}

/**
 * Get completion status for a specific partner task and date.
 * Returns completion info for both users.
 * 
 * @param partnerTaskId - The partner task ID
 * @param date - The date to check (YYYY-MM-DD format)
 * @returns { error, data } - Returns completion status for both users
 */
export async function getPartnerTaskCompletionStatus(
  partnerTaskId: string,
  date: string
): Promise<{
  error: Error | null
  data?: {
    currentUserCompleted: boolean
    currentUserCompletionId?: string
    currentUserPhotoUrl?: string
    partnerCompleted: boolean
    partnerCompletionId?: string
    partnerPhotoUrl?: string
  }
}> {
  try {
    console.log('[PartnerTasks] Getting completion status for task:', partnerTaskId, 'date:', date)

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    // Get the partner task to find the other user
    const { data: partnerTask, error: taskError } = await supabase
      .from('partner_tasks')
      .select('*')
      .eq('id', partnerTaskId)
      .single()

    if (taskError || !partnerTask) {
      return { error: new Error('Partner task not found') }
    }

    // Only show status for accepted tasks
    if (partnerTask.status !== 'accepted') {
      return {
        error: null,
        data: {
          currentUserCompleted: false,
          partnerCompleted: false,
        },
      }
    }

    // Determine partner ID
    const partnerId = partnerTask.creator_profile_id === user.id
      ? partnerTask.partner_profile_id
      : partnerTask.creator_profile_id

    // Get completions for this task and date
    const { data: completions, error: completionsError } = await supabase
      .from('partner_task_completions')
      .select('*')
      .eq('partner_task_id', partnerTaskId)
      .eq('completion_date', date)

    if (completionsError) {
      return { error: new Error(completionsError.message) }
    }

    // Find current user's completion
    const currentUserCompletion = completions?.find((c: any) => c.profile_id === user.id)
    
    // Find partner's completion
    const partnerCompletion = completions?.find((c: any) => c.profile_id === partnerId)

    return {
      error: null,
      data: {
        currentUserCompleted: !!currentUserCompletion,
        currentUserCompletionId: currentUserCompletion?.id.toString(),
        currentUserPhotoUrl: currentUserCompletion?.photo_url,
        partnerCompleted: !!partnerCompletion,
        partnerCompletionId: partnerCompletion?.id.toString(),
        partnerPhotoUrl: partnerCompletion?.photo_url,
      },
    }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error getting completion status:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to get completion status'),
    }
  }
}

/**
 * Toggle partner task completion.
 * If not completed for the date → insert a completion.
 * If already completed → delete the completion.
 * 
 * @param profileId - The profile ID completing the task
 * @param partnerTaskId - The partner task ID
 * @param date - The date to complete for (YYYY-MM-DD format)
 * @param photoUrl - The photo URL (required for completion)
 * @returns { error, completed } - Returns the new state (true = completed, false = not completed)
 */
export async function togglePartnerTaskCompletion(
  profileId: string,
  partnerTaskId: string,
  date: string,
  photoUrl?: string
): Promise<{ error: Error | null; completed?: boolean; data?: PartnerTaskCompletion }> {
  try {
    console.log('[PartnerTasks] Toggling completion for task:', partnerTaskId, 'date:', date)

    // Check if completion already exists
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('partner_task_completions')
      .select('*')
      .eq('partner_task_id', partnerTaskId)
      .eq('profile_id', profileId)
      .eq('completion_date', date)
      .maybeSingle()

    if (fetchError) {
      console.error('[PartnerTasks] Error checking existing completion:', fetchError)
      return { error: new Error(fetchError.message) }
    }

    if (existingCompletion) {
      // Completion exists → delete it (uncomplete)
      console.log('[PartnerTasks] Deleting existing completion:', existingCompletion.id)
      
      const { error: deleteError } = await supabase
        .from('partner_task_completions')
        .delete()
        .eq('id', existingCompletion.id)

      if (deleteError) {
        console.error('[PartnerTasks] Error deleting completion:', deleteError)
        return { error: new Error(deleteError.message) }
      }

      console.log('[PartnerTasks] Completion deleted successfully')
      return { error: null, completed: false }
    } else {
      // Completion doesn't exist → create it (complete)
      if (!photoUrl) {
        return { error: new Error('Photo URL is required to complete a partner task') }
      }

      console.log('[PartnerTasks] Creating new completion')
      
      const { data, error: insertError } = await supabase
        .from('partner_task_completions')
        .insert({
          partner_task_id: partnerTaskId,
          profile_id: profileId,
          completion_date: date,
          photo_url: photoUrl,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[PartnerTasks] Error creating completion:', insertError)
        return { error: new Error(insertError.message) }
      }

      console.log('[PartnerTasks] Completion created successfully')
      return {
        error: null,
        completed: true,
        data: {
          id: data.id.toString(),
          partner_task_id: data.partner_task_id.toString(),
          profile_id: data.profile_id,
          completion_date: data.completion_date,
          photo_url: data.photo_url,
          created_at: data.created_at,
        },
      }
    }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error toggling completion:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to toggle completion'),
    }
  }
}

/**
 * Delete a partner task completion.
 * Used to "uncheck" a completed partner task for a specific date.
 * 
 * @param completionId - The completion ID to delete
 * @returns { error } - Returns null on success, error otherwise
 */
export async function deletePartnerTaskCompletion(
  completionId: string
): Promise<{ error: Error | null }> {
  try {
    console.log('[PartnerTasks] Deleting completion:', completionId)

    const { error } = await supabase
      .from('partner_task_completions')
      .delete()
      .eq('id', completionId)

    if (error) {
      console.error('[PartnerTasks] Error deleting completion:', error)
      return { error: new Error(error.message) }
    }

    console.log('[PartnerTasks] Completion deleted successfully')
    return { error: null }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error deleting completion:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to delete completion'),
    }
  }
}

/**
 * Delete a partner task.
 * Only the creator or partner can delete the task.
 * This will also cascade delete all completions.
 * 
 * @param profileId - The profile ID of the user deleting the task
 * @param partnerTaskId - The partner task ID to delete
 * @returns { error } - Returns null on success, error otherwise
 */
export async function deletePartnerTask(
  profileId: string,
  partnerTaskId: string
): Promise<{ error: Error | null }> {
  try {
    console.log('[PartnerTasks] Deleting partner task:', partnerTaskId, 'by user:', profileId)

    // Verify the task exists and user has permission (must be creator or partner)
    const { data: existingTask, error: fetchError } = await supabase
      .from('partner_tasks')
      .select('*')
      .eq('id', partnerTaskId)
      .single()

    if (fetchError || !existingTask) {
      console.error('[PartnerTasks] Partner task not found:', fetchError)
      return { error: new Error('Partner task not found') }
    }

    // Check if user is creator or partner
    const isCreator = existingTask.creator_profile_id === profileId
    const isPartner = existingTask.partner_profile_id === profileId

    if (!isCreator && !isPartner) {
      console.error('[PartnerTasks] User does not have permission to delete this task')
      return { error: new Error('You do not have permission to delete this task') }
    }

    // Delete the task (cascade will delete all completions)
    const { error: deleteError } = await supabase
      .from('partner_tasks')
      .delete()
      .eq('id', partnerTaskId)

    if (deleteError) {
      console.error('[PartnerTasks] Error deleting partner task:', deleteError)
      return { error: new Error(deleteError.message) }
    }

    console.log('[PartnerTasks] Partner task deleted successfully')
    return { error: null }
  } catch (err) {
    console.error('[PartnerTasks] Unexpected error deleting partner task:', err)
    return {
      error: err instanceof Error ? err : new Error('Failed to delete partner task'),
    }
  }
}

