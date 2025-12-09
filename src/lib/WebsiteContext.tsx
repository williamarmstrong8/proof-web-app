import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'
import { useAuth } from './auth'

export interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  dob: string | null
  avatar_url: string | null
  caption: string | null
  created_at: string
  updated_at: string
}

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
  streak?: number // Current streak for this friend (calculated from their task completions)
}

export interface Task {
  id: string
  owner_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  completed_today?: boolean
  completion_id?: string
  completion_photo_url?: string
  completion_caption?: string
  current_streak?: number
  total_completions?: number
}

export interface TaskCompletion {
  id: string
  task_id: string
  user_id: string
  completed_on: string
  caption: string | null
  photo_url: string | null
  task_title_snapshot: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  image: string
  date: string
  task_title?: string
  caption?: string | null
}

// Post format for PostFeed/PostCard (includes user info)
export interface SocialPost {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar: string
  }
  task: string
  proofImage: string
  timestamp: string
  likes: number
  comments: number
}

interface WebsiteData {
  profile: Profile | null
  tasks: Task[]
  posts: Post[]
  friends: FriendshipWithProfile[]
  incomingRequests: FriendshipWithProfile[]
  outgoingRequests: FriendshipWithProfile[]
  friendPosts: SocialPost[]
}

interface WebsiteContextType {
  profile: Profile | null
  tasks: Task[]
  posts: Post[]
  friends: FriendshipWithProfile[]
  incomingRequests: FriendshipWithProfile[]
  outgoingRequests: FriendshipWithProfile[]
  friendPosts: SocialPost[]
  loading: boolean
  error: string | null
  refetchProfile: () => Promise<void>
  refetchTasks: () => Promise<void>
  refetchPosts: (userId?: string) => Promise<void>
  refetchFriendships: () => Promise<void>
  refetchFriendPosts: () => Promise<void>
  updateProfile: (data: {
    username?: string
    first_name?: string
    last_name?: string
    dob?: string
    avatar_url?: string
    caption?: string
  }) => Promise<{ error: Error | null }>
  createTask: (title: string, description?: string) => Promise<{ error: Error | null; task?: Task }>
  updateTask: (taskId: string, title: string, description?: string) => Promise<{ error: Error | null }>
  deleteTask: (taskId: string) => Promise<{ error: Error | null }>
  completeTask: (taskId: string, photo: File, caption?: string) => Promise<{ error: Error | null }>
  uncompleteTask: (taskId: string, completionId: string) => Promise<{ error: Error | null }>
  // Friendship functions
  sendFriendRequest: (targetUserId: string) => Promise<{ error: Error | null }>
  acceptFriendRequest: (requesterId: string) => Promise<{ error: Error | null }>
  unfriendOrCancel: (otherUserId: string) => Promise<{ error: Error | null }>
  searchUsers: (searchQuery: string) => Promise<{ error: Error | null; data?: Profile[] }>
  getFriendshipStatus: (otherUserId: string) => 'none' | 'outgoing' | 'incoming' | 'friends'
}

const defaultWebsiteData: WebsiteData = {
  profile: null,
  tasks: [],
  posts: [],
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  friendPosts: [],
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined)

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [websiteData, setWebsiteData] = useState<WebsiteData>(defaultWebsiteData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedUserIdRef = useRef<string | null>(null)

  // Helper function to set profile
  const setProfileSuccess = useCallback((profile: Profile | null) => {
    setWebsiteData(prev => ({
      ...prev,
      profile,
    }))
    setLoading(false)
    setError(null)
  }, [])

  // Helper function to set profile error
  const setProfileError = useCallback((errorMessage: string) => {
    setWebsiteData(prev => ({
      ...prev,
      profile: null,
    }))
    setLoading(false)
    setError(errorMessage)
  }, [])

  // Helper function to set profile loading
  const setProfileLoading = useCallback(() => {
    setLoading(true)
    setError(null)
  }, [])

  // Fetch profile data
  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    console.log('[WebsiteContext] Fetching profile from Supabase for user:', userId)
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist yet - this is OK
          console.log('[WebsiteContext] Profile data: Not found (profile does not exist yet)')
          setProfileSuccess(null)
          return
        }
        throw fetchError
      }

      console.log('[WebsiteContext] Profile data loaded:', {
        id: data?.id,
        username: data?.username,
        firstName: data?.first_name,
        lastName: data?.last_name,
        email: data?.email
      })
      setProfileSuccess(data as Profile | null)
    } catch (err) {
      console.error('[WebsiteContext] Error fetching profile:', err)
      setProfileError(err instanceof Error ? err.message : 'Failed to fetch profile')
    }
  }, [setProfileSuccess, setProfileError])

  // Helper function to get today's date in local timezone (YYYY-MM-DD)
  const getLocalDateString = useCallback((): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Helper function to calculate current streak from completion dates
  const calculateCurrentStreak = useCallback((completionDates: string[]): number => {
    if (completionDates.length === 0) return 0

    // Normalize all completion dates to YYYY-MM-DD format (local timezone)
    // Supabase DATE type returns as YYYY-MM-DD string, so handle directly
    const sortedDates = [...new Set(completionDates)]
      .map(d => {
        // If it's already a date string in YYYY-MM-DD format, use it directly
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
          return d.trim()
        }
        // Otherwise, parse it and convert to local date string
        const date = new Date(d)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })
      .sort((a, b) => b.localeCompare(a))

    const today = getLocalDateString()
    const dateSet = new Set(sortedDates)

    // Calculate yesterday's date string
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayYear = yesterdayDate.getFullYear()
    const yesterdayMonth = String(yesterdayDate.getMonth() + 1).padStart(2, '0')
    const yesterdayDay = String(yesterdayDate.getDate()).padStart(2, '0')
    const yesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`

    // Determine starting point for streak calculation:
    // - If completed today, start from today
    // - If not completed today but completed yesterday, start from yesterday (streak persists)
    // - If neither today nor yesterday completed, streak is 0
    let startDate: Date
    if (dateSet.has(today)) {
      startDate = new Date() // Start from today
    } else if (dateSet.has(yesterday)) {
      startDate = new Date(yesterdayDate) // Start from yesterday (streak persists)
    } else {
      return 0 // No completion today or yesterday - streak is broken
    }

    // Calculate consecutive days from the start date backwards
    let streak = 0
    let checkDate = new Date(startDate)
    
    // Check up to 1000 days back (safety limit)
    for (let i = 0; i < 1000; i++) {
      const checkYear = checkDate.getFullYear()
      const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0')
      const checkDay = String(checkDate.getDate()).padStart(2, '0')
      const checkDateStr = `${checkYear}-${checkMonth}-${checkDay}`
      
      if (dateSet.has(checkDateStr)) {
        streak++
        // Go back one day
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break // Streak broken
      }
    }

    return streak
  }, [getLocalDateString])

  // Fetch tasks with today's completion status, streaks, and totals
  const fetchTasks = useCallback(async (userId: string): Promise<void> => {
    console.log('[WebsiteContext] Fetching tasks from Supabase for user:', userId)
    try {
      // Get all tasks for user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (tasksError) {
        throw tasksError
      }

      if (!tasksData || tasksData.length === 0) {
        setWebsiteData(prev => ({ ...prev, tasks: [] }))
        return
      }

      // Get all completions for all tasks in one query
      const taskIds = tasksData.map(t => t.id)
      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select('id, task_id, photo_url, caption, completed_on')
        .eq('user_id', userId)
        .in('task_id', taskIds)
        .order('completed_on', { ascending: false })

      if (completionsError) {
        console.error('[WebsiteContext] Error fetching completions:', completionsError)
        // Continue with tasks even if completions fail
      }

      // Group completions by task_id
      const completionsByTask = new Map<number, any[]>()
      if (completionsData) {
        completionsData.forEach((completion: any) => {
          const taskId = completion.task_id
          if (!completionsByTask.has(taskId)) {
            completionsByTask.set(taskId, [])
          }
          completionsByTask.get(taskId)!.push(completion)
        })
      }

      // Process the data to include today's completion status, streaks, and totals
      const today = getLocalDateString()
      const tasksWithStatus = tasksData.map((task: any) => {
        const completions = completionsByTask.get(task.id) || []
        const completionDates = completions.map((c: any) => c.completed_on)
        
        // Find today's completion if it exists
        // completed_on is stored as DATE type in Supabase, which returns as YYYY-MM-DD string
        const todayCompletion = completions.find((tc: any) => {
          if (!tc.completed_on) return false
          
          // Supabase DATE type returns as string in YYYY-MM-DD format
          // Handle both date strings and timestamps, normalize to YYYY-MM-DD
          let completedDate: string
          if (typeof tc.completed_on === 'string') {
            // Remove time portion if present, trim whitespace
            completedDate = tc.completed_on.split('T')[0].trim()
          } else {
            // If it's not a string, convert to date string
            const date = new Date(tc.completed_on)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            completedDate = `${year}-${month}-${day}`
          }
          
          return completedDate === today
        })

        // Calculate current streak
        const currentStreak = calculateCurrentStreak(completionDates)
        
        // Debug logging for streak calculation
        if (completionDates.length > 0) {
          console.log('[WebsiteContext] Streak calculation for task', task.id, ':', {
            taskTitle: task.title,
            completionDates,
            currentStreak,
            today: getLocalDateString()
          })
        }

        return {
          id: task.id.toString(),
          owner_id: task.owner_id,
          title: task.title,
          description: task.description,
          created_at: task.created_at,
          updated_at: task.updated_at,
          completed_today: !!todayCompletion,
          completion_id: todayCompletion?.id?.toString(),
          completion_photo_url: todayCompletion?.photo_url,
          completion_caption: todayCompletion?.caption,
          current_streak: currentStreak,
          total_completions: completions.length,
        }
      })

      console.log('[WebsiteContext] Tasks loaded:', tasksWithStatus.length)
      setWebsiteData(prev => ({ ...prev, tasks: tasksWithStatus }))
    } catch (err) {
      console.error('[WebsiteContext] Error fetching tasks:', err)
      // Don't throw - tasks are optional, profile is more important
    }
  }, [calculateCurrentStreak, getLocalDateString])

  // Fetch posts (task completions) for a user
  const fetchPosts = useCallback(async (userId?: string): Promise<void> => {
    const targetUserId = userId || user?.id
    if (!targetUserId) {
      setWebsiteData(prev => ({ ...prev, posts: [] }))
      return
    }

    console.log('[WebsiteContext] Fetching posts from Supabase for user:', targetUserId)
    try {
      // Get all task completions (posts) for the user, ordered by most recent
      const { data, error: fetchError } = await supabase
        .from('task_completions')
        .select(`
          id,
          photo_url,
          caption,
          completed_on,
          created_at,
          task_title_snapshot,
          tasks (
            title
          )
        `)
        .eq('user_id', targetUserId)
        .not('photo_url', 'is', null) // Only get completions with photos
        .order('created_at', { ascending: false })
        .limit(50) // Limit to most recent 50 posts

      if (fetchError) {
        throw fetchError
      }

      // Transform task_completions to Post format for PostGrid
      const posts: Post[] = (data || []).map((completion: any) => ({
        id: completion.id.toString(),
        image: completion.photo_url || '',
        date: completion.completed_on || completion.created_at,
        task_title: completion.task_title_snapshot || completion.tasks?.title || 'Task',
        caption: completion.caption,
      }))

      console.log('[WebsiteContext] Posts loaded:', posts.length)
      setWebsiteData(prev => ({ ...prev, posts }))
    } catch (err) {
      console.error('[WebsiteContext] Error fetching posts:', err)
      // Don't throw - posts are optional
      setWebsiteData(prev => ({ ...prev, posts: [] }))
    }
  }, [user])

  // Fetch friendships (friends, incoming requests, outgoing requests) - optimized single query
  const fetchFriendships = useCallback(async (userId: string): Promise<void> => {
    try {
      // Single query to get all friendships for this user
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

      if (friendshipsError) {
        console.error('[WebsiteContext] Error fetching friendships:', friendshipsError)
        setWebsiteData(prev => ({
          ...prev,
          friends: [],
          incomingRequests: [],
          outgoingRequests: [],
        }))
        return
      }

      if (!friendshipsData || friendshipsData.length === 0) {
        setWebsiteData(prev => ({
          ...prev,
          friends: [],
          incomingRequests: [],
          outgoingRequests: [],
        }))
        return
      }

      // Get all user IDs involved in friendships
      const userIds = new Set<string>()
      friendshipsData.forEach((f: any) => {
        if (f.requester_id !== userId) userIds.add(f.requester_id)
        if (f.addressee_id !== userId) userIds.add(f.addressee_id)
      })

      // Fetch all profiles in one query
      const profileIds = Array.from(userIds)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds)

      if (profilesError) {
        console.error('[WebsiteContext] Error fetching friend profiles:', profilesError)
        // Still set empty arrays on profile error
        setWebsiteData(prev => ({
          ...prev,
          friends: [],
          incomingRequests: [],
          outgoingRequests: [],
        }))
        return
      }

      // Create profile map
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p as Profile]))

      // Categorize friendships
      const friends: FriendshipWithProfile[] = []
      const incomingRequests: FriendshipWithProfile[] = []
      const outgoingRequests: FriendshipWithProfile[] = []

      // Get all confirmed friend IDs to fetch their streaks
      const confirmedFriendIds = friendshipsData
        .filter((f: any) => f.status === 'confirmed')
        .map((f: any) => f.requester_id === userId ? f.addressee_id : f.requester_id)

      // Fetch task completions for all confirmed friends to calculate streaks
      let friendStreaksMap = new Map<string, number>()
      if (confirmedFriendIds.length > 0) {
        const { data: friendCompletionsData, error: completionsError } = await supabase
          .from('task_completions')
          .select('user_id, completed_on')
          .in('user_id', confirmedFriendIds)
          .not('completed_on', 'is', null)

        if (!completionsError && friendCompletionsData) {
          // Group completions by user_id
          const completionsByUser = new Map<string, string[]>()
          friendCompletionsData.forEach((c: any) => {
            const userId = c.user_id
            const date = c.completed_on
            if (!completionsByUser.has(userId)) {
              completionsByUser.set(userId, [])
            }
            completionsByUser.get(userId)!.push(date)
          })

          // Calculate streak for each friend
          completionsByUser.forEach((dates, friendUserId) => {
            const streak = calculateCurrentStreak(dates)
            friendStreaksMap.set(friendUserId, streak)
          })
        }
      }

      friendshipsData.forEach((f: any) => {
        const otherUserId = f.requester_id === userId ? f.addressee_id : f.requester_id
        const profile = profileMap.get(otherUserId)

        if (!profile) return // Skip if profile not found

        const friendship: FriendshipWithProfile = {
          id: f.id.toString(),
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          created_at: f.created_at,
          updated_at: f.updated_at,
          profile,
          streak: f.status === 'confirmed' ? (friendStreaksMap.get(otherUserId) || 0) : undefined,
        }

        if (f.status === 'confirmed') {
          friends.push(friendship)
        } else if (f.status === 'requested') {
          if (f.addressee_id === userId) {
            // User is the addressee - incoming request
            incomingRequests.push(friendship)
          } else {
            // User is the requester - outgoing request
            outgoingRequests.push(friendship)
          }
        }
      })

      setWebsiteData(prev => ({
        ...prev,
        friends,
        incomingRequests,
        outgoingRequests,
      }))
    } catch (err) {
      console.error('[WebsiteContext] Error fetching friendships:', err)
      setWebsiteData(prev => ({
        ...prev,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
      }))
    }
  }, [])

  // Fetch posts from friends only
  const fetchFriendPosts = useCallback(async (userId: string): Promise<void> => {
    try {
      // Get friend IDs from confirmed friendships
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'confirmed')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

      if (friendshipsError) {
        console.error('[WebsiteContext] Error fetching friendships for posts:', friendshipsError)
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      if (!friendshipsData || friendshipsData.length === 0) {
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      // Get all friend IDs
      const friendIds = new Set<string>()
      friendshipsData.forEach((f: any) => {
        if (f.requester_id !== userId) friendIds.add(f.requester_id)
        if (f.addressee_id !== userId) friendIds.add(f.addressee_id)
      })

      const friendIdsArray = Array.from(friendIds)

      if (friendIdsArray.length === 0) {
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      // Fetch task completions (posts) from friends
      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select(`
          id,
          user_id,
          photo_url,
          caption,
          completed_on,
          created_at,
          task_title_snapshot
        `)
        .in('user_id', friendIdsArray)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (completionsError) {
        console.error('[WebsiteContext] Error fetching friend posts:', completionsError)
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      if (!completionsData || completionsData.length === 0) {
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      // Fetch profiles for all friends who have posts
      const postUserIds = [...new Set(completionsData.map((c: any) => c.user_id))]
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', postUserIds)

      if (profilesError) {
        console.error('[WebsiteContext] Error fetching friend profiles for posts:', profilesError)
        setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
        return
      }

      // Create profile map
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p as Profile]))

      // Transform to SocialPost format (for PostFeed/PostCard)
      const friendPosts: SocialPost[] = completionsData
        .map((completion: any) => {
          const profile = profileMap.get(completion.user_id)
          if (!profile) return null

          const displayName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.username || profile.email || 'Unknown User'

          // Calculate relative timestamp (e.g., "2 hours ago")
          const completionDate = new Date(completion.created_at || completion.completed_on)
          const now = new Date()
          const diffMs = now.getTime() - completionDate.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          
          let timestamp: string
          if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60))
            timestamp = diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
          } else if (diffHours < 24) {
            timestamp = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
          } else if (diffDays < 7) {
            timestamp = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
          } else {
            timestamp = completionDate.toLocaleDateString()
          }

          return {
            id: completion.id.toString(),
            user: {
              id: profile.id,
              name: displayName,
              username: profile.username ? `@${profile.username}` : '@no-username',
              avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
            },
            task: completion.task_title_snapshot || 'Task',
            proofImage: completion.photo_url || '',
            timestamp,
            likes: 0, // TODO: Add likes functionality
            comments: 0, // TODO: Add comments functionality
          }
        })
        .filter((p): p is SocialPost => p !== null)

      setWebsiteData(prev => ({ ...prev, friendPosts }))
    } catch (err) {
      console.error('[WebsiteContext] Error fetching friend posts:', err)
      setWebsiteData(prev => ({ ...prev, friendPosts: [] }))
    }
  }, [])

  // Fetch all website data once when user is available
  const fetchWebsiteData = useCallback(async () => {
    if (!user) {
      setWebsiteData(defaultWebsiteData)
      setLoading(false)
      setError(null)
      fetchedUserIdRef.current = null
      return
    }

    // Prevent duplicate fetches for the same user
    if (fetchedUserIdRef.current === user.id) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      fetchedUserIdRef.current = user.id

      console.log('[WebsiteContext] Initializing website data load for user:', user.id)

      // Fetch all data in parallel
      await Promise.all([
        fetchProfile(user.id),
        fetchTasks(user.id),
        fetchPosts(user.id),
        fetchFriendships(user.id),
        fetchFriendPosts(user.id),
      ])

      console.log('[WebsiteContext] Website data load complete')
    } catch (err) {
      console.error('[WebsiteContext] Error in fetchWebsiteData:', err)
      setError(err instanceof Error ? err.message : 'Failed to load website data')
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchProfile, fetchTasks, fetchPosts, fetchFriendships, fetchFriendPosts])

  // Initial data load - only runs once when user becomes available
  // Pattern: Single fetch on mount when user is available, similar to previous project
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // Fetch data once - fetchWebsiteData handles duplicate prevention via fetchedUserIdRef
    fetchWebsiteData()
    // Only re-run if auth loading completes or user changes (login/logout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  // Manual refetch functions
  const refetchProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setWebsiteData(defaultWebsiteData)
      setLoading(false)
      fetchedUserIdRef.current = null
      return
    }

    console.log('[WebsiteContext] Manually refetching profile data')
    setProfileLoading()
    fetchedUserIdRef.current = null // Reset to force refetch
    await fetchProfile(user.id)
    fetchedUserIdRef.current = user.id
  }, [user, fetchProfile, setProfileLoading])

  const refetchTasks = useCallback(async (): Promise<void> => {
    if (!user) {
      return
    }
    console.log('[WebsiteContext] Manually refetching tasks')
    await fetchTasks(user.id)
  }, [user, fetchTasks])

  const refetchPosts = useCallback(async (userId?: string): Promise<void> => {
    const targetUserId = userId || user?.id
    if (!targetUserId) {
      return
    }
    console.log('[WebsiteContext] Manually refetching posts')
    await fetchPosts(targetUserId)
  }, [user, fetchPosts])

  const refetchFriendships = useCallback(async (): Promise<void> => {
    if (!user) {
      return
    }
    console.log('[WebsiteContext] Manually refetching friendships')
    await fetchFriendships(user.id)
  }, [user, fetchFriendships])

  const refetchFriendPosts = useCallback(async (): Promise<void> => {
    if (!user) {
      return
    }
    await fetchFriendPosts(user.id)
  }, [user, fetchFriendPosts])

  // Update profile function
  const updateProfile = useCallback(async (data: {
    username?: string
    first_name?: string
    last_name?: string
    dob?: string
    avatar_url?: string
    caption?: string
  }): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      const profileData = {
        id: user.id,
        email: user.email || '',
        ...data,
        updated_at: new Date().toISOString(),
      }

      // Use upsert to either update or insert
      // Rely on database unique constraint for username validation
      console.log('[WebsiteContext] Upserting profile in profiles table for userId:', user.id)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          ...profileData,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('[WebsiteContext] Upsert error:', upsertError)
        // Handle unique constraint violations
        if (upsertError.code === '23505') {
          if (upsertError.message.includes('username')) {
            return { error: new Error('Username already taken') }
          }
          if (upsertError.message.includes('email')) {
            return { error: new Error('Email already in use') }
          }
        }
        return { error: upsertError }
      }

      console.log('[WebsiteContext] Profile upsert successful')
      // Refetch profile to get updated data
      await refetchProfile()
      return { error: null }
    } catch (err) {
      console.error('[WebsiteContext] Error updating profile:', err)
      return { error: err instanceof Error ? err : new Error('Failed to update profile') }
    }
  }, [user, refetchProfile])

  // Create task function
  const createTask = useCallback(async (
    title: string, 
    description?: string
  ): Promise<{ error: Error | null; task?: Task }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      console.log('[WebsiteContext] Creating task:', title)
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[WebsiteContext] Error creating task:', insertError)
        return { error: insertError }
      }

      console.log('[WebsiteContext] Task created successfully')
      // Refetch tasks to get updated list
      await refetchTasks()
      
      return { 
        error: null, 
        task: {
          id: data.id.toString(),
          owner_id: data.owner_id,
          title: data.title,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at,
          completed_today: false,
        }
      }
    } catch (err) {
      console.error('[WebsiteContext] Error creating task:', err)
      return { error: err instanceof Error ? err : new Error('Failed to create task') }
    }
  }, [user, refetchTasks])

  // Update task function
  const updateTask = useCallback(async (
    taskId: string,
    title: string,
    description?: string
  ): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      console.log('[WebsiteContext] Updating task:', taskId)
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('owner_id', user.id) // Ensure user owns the task

      if (updateError) {
        console.error('[WebsiteContext] Error updating task:', updateError)
        return { error: updateError }
      }

      console.log('[WebsiteContext] Task updated successfully')
      // Refetch tasks to get updated list
      await refetchTasks()
      
      return { error: null }
    } catch (err) {
      console.error('[WebsiteContext] Error updating task:', err)
      return { error: err instanceof Error ? err : new Error('Failed to update task') }
    }
  }, [user, refetchTasks])

  // Delete task function
  const deleteTask = useCallback(async (taskId: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      console.log('[WebsiteContext] Deleting task:', taskId)
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('owner_id', user.id) // Ensure user owns the task

      if (deleteError) {
        console.error('[WebsiteContext] Error deleting task:', deleteError)
        return { error: deleteError }
      }

      console.log('[WebsiteContext] Task deleted successfully')
      // Update local state immediately
      setWebsiteData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }))
      
      return { error: null }
    } catch (err) {
      console.error('[WebsiteContext] Error deleting task:', err)
      return { error: err instanceof Error ? err : new Error('Failed to delete task') }
    }
  }, [user])

  // Helper function to compress image to ~100KB while maintaining quality
  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      console.log('[WebsiteContext] Compressing image:', {
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        originalType: file.type
      })

      const options = {
        maxSizeMB: 0.3, // Target 300KB (0.3 MB)
        maxWidthOrHeight: 1920, // Max dimension to maintain quality
        useWebWorker: true, // Use web worker for better performance
        fileType: file.type, // Preserve original file type
        initialQuality: 0.9, // Start with high quality
        alwaysKeepResolution: false, // Allow resizing if needed
      }

      const compressedFile = await imageCompression(file, options)
      
      console.log('[WebsiteContext] Image compressed:', {
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        compressionRatio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
      })

      return compressedFile
    } catch (error) {
      console.error('[WebsiteContext] Error compressing image:', error)
      // If compression fails, return original file
      return file
    }
  }, [])

  // Complete task function (with photo upload)
  const completeTask = useCallback(async (
    taskId: string,
    photo: File,
    caption?: string
  ): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      console.log('[WebsiteContext] Completing task:', taskId)

      // 1. Compress image before uploading
      const compressedPhoto = await compressImage(photo)

      // 2. Upload compressed photo to Supabase Storage
      const timestamp = Date.now()
      const fileExt = compressedPhoto.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(filePath, compressedPhoto, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[WebsiteContext] Error uploading photo:', uploadError)
        return { error: new Error('Failed to upload photo') }
      }

      // 2. Get public URL for the uploaded photo
      const { data: urlData } = supabase.storage
        .from('task-photos')
        .getPublicUrl(uploadData.path)

      const photoUrl = urlData.publicUrl

      // 3. Get task title for snapshot
      const task = websiteData.tasks.find(t => t.id === taskId)
      const taskTitle = task?.title || ''

      // 4. Insert completion record
      const today = getLocalDateString()
      const { error: insertError } = await supabase
        .from('task_completions')
        .insert({
          task_id: parseInt(taskId),
          user_id: user.id,
          completed_on: today,
          photo_url: photoUrl,
          caption: caption?.trim() || null,
          task_title_snapshot: taskTitle,
        })

      if (insertError) {
        console.error('[WebsiteContext] Error inserting completion:', insertError)
        // Try to clean up uploaded photo
        await supabase.storage.from('task-photos').remove([filePath])
        return { error: insertError }
      }

      console.log('[WebsiteContext] Task completed successfully')
      // Refetch tasks and posts to update completion status and feed
      await Promise.all([
        refetchTasks(),
        refetchPosts(),
      ])
      
      return { error: null }
    } catch (err) {
      console.error('[WebsiteContext] Error completing task:', err)
      return { error: err instanceof Error ? err : new Error('Failed to complete task') }
    }
  }, [user, websiteData.tasks, refetchTasks, refetchPosts, compressImage])

  // Uncomplete task function
  const uncompleteTask = useCallback(async (
    taskId: string,
    completionId: string
  ): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      console.log('[WebsiteContext] Uncompleting task:', taskId)

      // Get the completion to find the photo URL
      const { data: completion, error: fetchError } = await supabase
        .from('task_completions')
        .select('photo_url')
        .eq('id', completionId)
        .eq('user_id', user.id) // Ensure user owns the completion
        .single()

      if (fetchError) {
        console.error('[WebsiteContext] Error fetching completion:', fetchError)
        return { error: fetchError }
      }

      // Delete the completion record
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', completionId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[WebsiteContext] Error deleting completion:', deleteError)
        return { error: deleteError }
      }

      // Try to delete the photo from storage (best effort - don't fail if it doesn't work)
      if (completion.photo_url) {
        try {
          const url = new URL(completion.photo_url)
          const pathParts = url.pathname.split('/task-photos/')
          if (pathParts.length > 1) {
            const filePath = pathParts[1]
            await supabase.storage.from('task-photos').remove([filePath])
          }
        } catch (err) {
          console.warn('[WebsiteContext] Could not delete photo from storage:', err)
          // Don't fail the operation if storage delete fails
        }
      }

      console.log('[WebsiteContext] Task uncompleted successfully')
      // Refetch tasks and posts to update completion status and feed
      await Promise.all([
        refetchTasks(),
        refetchPosts(),
      ])
      
      return { error: null }
    } catch (err) {
      console.error('[WebsiteContext] Error uncompleting task:', err)
      return { error: err instanceof Error ? err : new Error('Failed to uncomplete task') }
    }
  }, [user, refetchTasks, refetchPosts])

  // Friendship action functions - all inline in WebsiteContext
  const sendFriendRequest = useCallback(async (targetUserId: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
        .maybeSingle()

      if (existing) {
        return { error: new Error('Friendship already exists') }
      }

      // Create new friendship request
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'requested',
        })

      if (error) {
        return { error: new Error(error.message) }
      }

      await Promise.all([
        refetchFriendships(),
        refetchFriendPosts(),
      ])
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to send friend request') }
    }
  }, [user, refetchFriendships, refetchFriendPosts])

  const acceptFriendRequest = useCallback(async (requesterId: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      // Find the friendship where requesterId sent the request to current user
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .eq('requester_id', requesterId)
        .eq('addressee_id', user.id)
        .eq('status', 'requested')
        .maybeSingle()

      if (fetchError) {
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
        return { error: new Error(updateError.message) }
      }

      await Promise.all([
        refetchFriendships(),
        refetchFriendPosts(),
      ])
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to accept friend request') }
    }
  }, [user, refetchFriendships, refetchFriendPosts])

  const unfriendOrCancel = useCallback(async (otherUserId: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      // Delete the friendship (works for either direction)
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)

      if (deleteError) {
        return { error: new Error(deleteError.message) }
      }

      await Promise.all([
        refetchFriendships(),
        refetchFriendPosts(),
      ])
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to unfriend') }
    }
  }, [user, refetchFriendships, refetchFriendPosts])

  const searchUsers = useCallback(async (searchQuery: string): Promise<{ error: Error | null; data?: Profile[] }> => {
    if (!user) {
      return { error: new Error('Not authenticated') }
    }

    try {
      if (!searchQuery.trim()) {
        return { error: null, data: [] }
      }

      const query = `%${searchQuery.toLowerCase()}%`

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.${query},first_name.ilike.${query},last_name.ilike.${query},email.ilike.${query}`)
        .limit(20)

      if (error) {
        return { error: new Error(error.message) }
      }

      return { error: null, data: data as Profile[] || [] }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to search users') }
    }
  }, [user])

  const getFriendshipStatus = useCallback((otherUserId: string): 'none' | 'outgoing' | 'incoming' | 'friends' => {
    // Check if they are friends
    const isFriend = websiteData.friends.some(
      f => f.profile.id === otherUserId
    )
    if (isFriend) return 'friends'

    // Check if there's an outgoing request
    const hasOutgoing = websiteData.outgoingRequests.some(
      f => f.profile.id === otherUserId
    )
    if (hasOutgoing) return 'outgoing'

    // Check if there's an incoming request
    const hasIncoming = websiteData.incomingRequests.some(
      f => f.profile.id === otherUserId
    )
    if (hasIncoming) return 'incoming'

    return 'none'
  }, [websiteData.friends, websiteData.incomingRequests, websiteData.outgoingRequests])

  const value: WebsiteContextType = {
    profile: websiteData.profile,
    tasks: websiteData.tasks,
    posts: websiteData.posts,
    friends: websiteData.friends,
    incomingRequests: websiteData.incomingRequests,
    outgoingRequests: websiteData.outgoingRequests,
    friendPosts: websiteData.friendPosts,
    loading,
    error,
    refetchProfile,
    refetchTasks,
    refetchPosts,
    refetchFriendships,
    refetchFriendPosts,
    updateProfile,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    sendFriendRequest,
    acceptFriendRequest,
    unfriendOrCancel,
    searchUsers,
    getFriendshipStatus,
  }

  return <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>
}

export function useWebsite() {
  const context = useContext(WebsiteContext)
  if (context === undefined) {
    throw new Error('useWebsite must be used within a WebsiteProvider')
  }
  return context
}
