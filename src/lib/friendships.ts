/**
 * Friendships Module
 * 
 * Simple TypeScript helpers for managing friendships in Supabase.
 * 
 * Friendship Flow:
 * 1. User A sends friend request to User B → status: "requested"
 * 2. User B accepts request → status: "confirmed"
 * 3. Either user can unfriend/cancel → row is deleted
 */

import { supabase } from './supabase'
import type { Profile } from './WebsiteContext'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'requested' | 'confirmed'
  created_at: string
  updated_at: string
}

export interface FriendshipWithProfile extends Friendship {
  profile: Profile
}

/**
 * Send a friend request from currentUserId to targetUserId.
 * Creates a row with status = "requested" if it doesn't already exist.
 * 
 * @returns { error, data } - Returns the created friendship or error
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<{ error: Error | null; data?: Friendship }> {
  try {
    console.log('[Friendships] Sending friend request from', currentUserId, 'to', targetUserId)

    // Check if friendship already exists (in either direction)
    const existingFriendship = await getFriendshipBetweenUsers(currentUserId, targetUserId)
    
    if (existingFriendship.data) {
      return { 
        error: new Error('Friendship already exists'), 
        data: existingFriendship.data 
      }
    }

    // Create new friendship request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: 'requested',
      })
      .select()
      .single()

    if (error) {
      console.error('[Friendships] Error sending friend request:', error)
      return { error: new Error(error.message) }
    }

    console.log('[Friendships] Friend request sent successfully')
    return { 
      error: null, 
      data: {
        id: data.id.toString(),
        requester_id: data.requester_id,
        addressee_id: data.addressee_id,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    }
  } catch (err) {
    console.error('[Friendships] Unexpected error sending friend request:', err)
    return { error: err instanceof Error ? err : new Error('Failed to send friend request') }
  }
}

/**
 * Accept a friend request. Updates the friendship status to "confirmed".
 * Only works if currentUserId is the addressee of the request.
 * 
 * @returns { error } - Returns null on success, error otherwise
 */
export async function acceptFriendRequest(
  currentUserId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  try {
    console.log('[Friendships] Accepting friend request from', requesterId)

    // Find the friendship where requesterId sent the request to currentUserId
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('addressee_id', currentUserId)
      .eq('status', 'requested')
      .maybeSingle()

    if (fetchError) {
      console.error('[Friendships] Error finding friend request:', fetchError)
      return { error: new Error(fetchError.message) }
    }

    if (!friendship) {
      return { error: new Error('Friend request not found') }
    }

    // Update status to confirmed
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'confirmed' })
      .eq('id', friendship.id)

    if (updateError) {
      console.error('[Friendships] Error accepting friend request:', updateError)
      return { error: new Error(updateError.message) }
    }

    console.log('[Friendships] Friend request accepted successfully')
    return { error: null }
  } catch (err) {
    console.error('[Friendships] Unexpected error accepting friend request:', err)
    return { error: err instanceof Error ? err : new Error('Failed to accept friend request') }
  }
}

/**
 * Unfriend or cancel a friend request.
 * Deletes the friendship row between currentUserId and otherUserId.
 * Works regardless of who originally requested the friendship.
 * 
 * @returns { error } - Returns null on success, error otherwise
 */
export async function unfriendOrCancel(
  currentUserId: string,
  otherUserId: string
): Promise<{ error: Error | null }> {
  try {
    console.log('[Friendships] Unfriending/canceling between', currentUserId, 'and', otherUserId)

    // Delete the friendship (works for either direction)
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`)

    if (deleteError) {
      console.error('[Friendships] Error unfriending:', deleteError)
      return { error: new Error(deleteError.message) }
    }

    console.log('[Friendships] Unfriend/cancel successful')
    return { error: null }
  } catch (err) {
    console.error('[Friendships] Unexpected error unfriending:', err)
    return { error: err instanceof Error ? err : new Error('Failed to unfriend') }
  }
}

/**
 * Get all confirmed friends for a user.
 * Returns friends with their profile information.
 * 
 * @returns { error, data } - Returns list of friends with profiles
 */
export async function getFriends(
  currentUserId: string
): Promise<{ error: Error | null; data?: FriendshipWithProfile[] }> {
  try {
    console.log('[Friendships] Getting friends for user:', currentUserId)

    // Get all confirmed friendships where user is either requester or addressee
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'confirmed')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (error) {
      console.error('[Friendships] Error fetching friends:', error)
      return { error: new Error(error.message) }
    }

    if (!data || data.length === 0) {
      return { error: null, data: [] }
    }

    // Get the IDs of all friends (the "other" person in each friendship)
    const friendIds = data.map((f: any) => 
      f.requester_id === currentUserId ? f.addressee_id : f.requester_id
    )

    // Fetch profiles for all friends
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)

    if (profilesError) {
      console.error('[Friendships] Error fetching friend profiles:', profilesError)
      return { error: new Error(profilesError.message) }
    }

    // Map profiles to friendships
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])
    
    const friendsWithProfiles: FriendshipWithProfile[] = data
      .map((f: any) => {
        const friendId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
        const profile = profileMap.get(friendId)
        
        if (!profile) return null
        
        return {
          id: f.id.toString(),
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          created_at: f.created_at,
          updated_at: f.updated_at,
          profile,
        }
      })
      .filter((f): f is FriendshipWithProfile => f !== null)

    console.log('[Friendships] Found', friendsWithProfiles.length, 'friends')
    return { error: null, data: friendsWithProfiles }
  } catch (err) {
    console.error('[Friendships] Unexpected error getting friends:', err)
    return { error: err instanceof Error ? err : new Error('Failed to get friends') }
  }
}

/**
 * Get all incoming friend requests (where currentUserId is the addressee).
 * Returns requests with the requester's profile information.
 * 
 * @returns { error, data } - Returns list of incoming requests with profiles
 */
export async function getIncomingRequests(
  currentUserId: string
): Promise<{ error: Error | null; data?: FriendshipWithProfile[] }> {
  try {
    console.log('[Friendships] Getting incoming requests for user:', currentUserId)
    console.log('[Friendships] User ID type:', typeof currentUserId, 'Value:', currentUserId)

    // First, let's check what the current user ID looks like
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[Friendships] Current authenticated user:', user?.id)
    console.log('[Friendships] Auth user error:', userError)
    console.log('[Friendships] Comparing IDs - currentUserId:', currentUserId, 'auth.user.id:', user?.id, 'Match:', currentUserId === user?.id)

    // Try querying ALL friendships first to see what we get
    console.log('[Friendships] Step 1: Querying ALL friendships table...')
    const { data: allFriendships, error: allError } = await supabase
      .from('friendships')
      .select('*')
    
    console.log('[Friendships] ALL friendships in table:', {
      data: allFriendships,
      error: allError,
      count: allFriendships?.length || 0,
    })

    // Also try querying for friendships where this user is involved (either direction)
    console.log('[Friendships] Step 1.5: Querying friendships where user is involved (either direction)...')
    const { data: userFriendships, error: userFriendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    
    console.log('[Friendships] Friendships where user is involved:', {
      data: userFriendships,
      error: userFriendshipsError,
      count: userFriendships?.length || 0,
    })
    
    if (userFriendships && userFriendships.length > 0) {
      userFriendships.forEach((f: any, index: number) => {
        console.log(`[Friendships] Friendship ${index + 1}:`, {
          id: f.id,
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          isRequester: f.requester_id === currentUserId,
          isAddressee: f.addressee_id === currentUserId,
        })
      })
    }

    // Now try querying for this specific user as addressee
    console.log('[Friendships] Step 2: Querying for addressee_id =', currentUserId)
    const { data: addresseeData, error: addresseeError } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', currentUserId)
    
    console.log('[Friendships] Friendships where user is addressee:', {
      data: addresseeData,
      error: addresseeError,
      count: addresseeData?.length || 0,
    })

    // Now try with status filter
    console.log('[Friendships] Step 3: Querying for addressee_id =', currentUserId, 'AND status = "requested"')
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', currentUserId)
      .eq('status', 'requested')

    if (error) {
      console.error('[Friendships] Error fetching incoming requests:', error)
      console.error('[Friendships] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return { error: new Error(error.message) }
    }

    console.log('[Friendships] Raw incoming requests data:', data)
    console.log('[Friendships] Data type:', Array.isArray(data), 'Length:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('[Friendships] First friendship record:', data[0])
      console.log('[Friendships] First record addressee_id:', data[0].addressee_id, 'Type:', typeof data[0].addressee_id)
      console.log('[Friendships] Current user ID:', currentUserId, 'Type:', typeof currentUserId)
      console.log('[Friendships] IDs match?', data[0].addressee_id === currentUserId)
    }

    if (!data || data.length === 0) {
      console.log('[Friendships] No incoming requests found with status filter')
      console.log('[Friendships] But we found', addresseeData?.length || 0, 'friendships where user is addressee')
      if (addresseeData && addresseeData.length > 0) {
        console.log('[Friendships] Statuses of those friendships:', addresseeData.map((f: any) => f.status))
      }
      return { error: null, data: [] }
    }

    // Get requester IDs
    const requesterIds = data.map((f: any) => f.requester_id)
    console.log('[Friendships] Requester IDs:', requesterIds)
    console.log('[Friendships] Number of requester IDs:', requesterIds.length)

    // Fetch profiles for all requesters
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', requesterIds)

    if (profilesError) {
      console.error('[Friendships] Error fetching requester profiles:', profilesError)
      return { error: new Error(profilesError.message) }
    }

    console.log('[Friendships] Fetched profiles:', profiles)

    // Map profiles to requests
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])
    
    const requestsWithProfiles: FriendshipWithProfile[] = data
      .map((f: any) => {
        const profile = profileMap.get(f.requester_id)
        
        if (!profile) {
          console.warn('[Friendships] No profile found for requester:', f.requester_id)
          return null
        }
        
        return {
          id: f.id.toString(),
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          created_at: f.created_at,
          updated_at: f.updated_at,
          profile,
        }
      })
      .filter((f): f is FriendshipWithProfile => f !== null)

    console.log('[Friendships] Found', requestsWithProfiles.length, 'incoming requests with profiles')
    return { error: null, data: requestsWithProfiles }
  } catch (err) {
    console.error('[Friendships] Unexpected error getting incoming requests:', err)
    return { error: err instanceof Error ? err : new Error('Failed to get incoming requests') }
  }
}

/**
 * Get all outgoing friend requests (where currentUserId is the requester).
 * Returns requests with the addressee's profile information.
 * 
 * @returns { error, data } - Returns list of outgoing requests with profiles
 */
export async function getOutgoingRequests(
  currentUserId: string
): Promise<{ error: Error | null; data?: FriendshipWithProfile[] }> {
  try {
    console.log('[Friendships] Getting outgoing requests for user:', currentUserId)

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', currentUserId)
      .eq('status', 'requested')

    if (error) {
      console.error('[Friendships] Error fetching outgoing requests:', error)
      return { error: new Error(error.message) }
    }

    if (!data || data.length === 0) {
      return { error: null, data: [] }
    }

    // Get addressee IDs
    const addresseeIds = data.map((f: any) => f.addressee_id)

    // Fetch profiles for all addressees
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', addresseeIds)

    if (profilesError) {
      console.error('[Friendships] Error fetching addressee profiles:', profilesError)
      return { error: new Error(profilesError.message) }
    }

    // Map profiles to requests
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])
    
    const requestsWithProfiles: FriendshipWithProfile[] = data
      .map((f: any) => {
        const profile = profileMap.get(f.addressee_id)
        
        if (!profile) return null
        
        return {
          id: f.id.toString(),
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          created_at: f.created_at,
          updated_at: f.updated_at,
          profile,
        }
      })
      .filter((f): f is FriendshipWithProfile => f !== null)

    console.log('[Friendships] Found', requestsWithProfiles.length, 'outgoing requests')
    return { error: null, data: requestsWithProfiles }
  } catch (err) {
    console.error('[Friendships] Unexpected error getting outgoing requests:', err)
    return { error: err instanceof Error ? err : new Error('Failed to get outgoing requests') }
  }
}

/**
 * Get all friendships for a user (both as requester and addressee).
 * This is a comprehensive function that fetches all friendships involving the user.
 * 
 * @returns { error, data } - Returns all friendships with profiles
 */
export async function getAllFriendshipsForUser(
  currentUserId: string
): Promise<{ error: Error | null; data?: Friendship[] }> {
  try {
    console.log('[Friendships] Getting all friendships for user:', currentUserId)

    // Get all friendships where user is either requester or addressee
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (error) {
      console.error('[Friendships] Error fetching all friendships:', error)
      return { error: new Error(error.message) }
    }

    console.log('[Friendships] Raw friendships data:', data)

    if (!data || data.length === 0) {
      console.log('[Friendships] No friendships found')
      return { error: null, data: [] }
    }

    const friendships: Friendship[] = data.map((f: any) => ({
      id: f.id.toString(),
      requester_id: f.requester_id,
      addressee_id: f.addressee_id,
      status: f.status,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }))

    console.log('[Friendships] Found', friendships.length, 'total friendships')
    return { error: null, data: friendships }
  } catch (err) {
    console.error('[Friendships] Unexpected error getting all friendships:', err)
    return { error: err instanceof Error ? err : new Error('Failed to get all friendships') }
  }
}

/**
 * Helper function to get the friendship status between two users.
 * Used internally to check if a friendship exists before creating one.
 * 
 * @returns { error, data } - Returns the friendship if it exists
 */
export async function getFriendshipBetweenUsers(
  userId1: string,
  userId2: string
): Promise<{ error: Error | null; data?: Friendship }> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
      .maybeSingle()

    if (error) {
      return { error: new Error(error.message) }
    }

    if (!data) {
      return { error: null, data: undefined }
    }

    return {
      error: null,
      data: {
        id: data.id.toString(),
        requester_id: data.requester_id,
        addressee_id: data.addressee_id,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to get friendship') }
  }
}

/**
 * Search for users by username, first name, or last name.
 * Returns matching profiles (excludes current user).
 * Email is excluded from search to prevent false positives.
 * 
 * @returns { error, data } - Returns list of matching profiles
 */
export async function searchUsers(
  searchQuery: string,
  currentUserId: string,
  limit: number = 20
): Promise<{ error: Error | null; data?: Profile[] }> {
  try {
    console.log('[Friendships] Searching users with query:', searchQuery)

    if (!searchQuery.trim()) {
      return { error: null, data: [] }
    }

    const searchTerm = searchQuery.toLowerCase().trim()
    const pattern = `%${searchTerm}%`

    // Search ONLY username, first_name, and last_name (NOT email)
    // Email causes false positives (e.g., "c" matches "user@company.com")
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId) // Exclude current user
      .or(`username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)
      .limit(limit)

    if (error) {
      console.error('[Friendships] Error searching users:', error)
      return { error: new Error(error.message) }
    }

    console.log('[Friendships] Found', data?.length || 0, 'users')
    return { error: null, data: data as Profile[] || [] }
  } catch (err) {
    console.error('[Friendships] Unexpected error searching users:', err)
    return { error: err instanceof Error ? err : new Error('Failed to search users') }
  }
}
