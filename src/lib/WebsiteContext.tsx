import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'
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

interface WebsiteData {
  profile: Profile | null
  tasks: Task[]
  posts: Post[]
}

interface WebsiteContextType {
  profile: Profile | null
  tasks: Task[]
  posts: Post[]
  loading: boolean
  error: string | null
  refetchProfile: () => Promise<void>
  refetchTasks: () => Promise<void>
  refetchPosts: (userId?: string) => Promise<void>
  updateProfile: (data: {
    username?: string
    first_name?: string
    last_name?: string
    dob?: string
    avatar_url?: string
    caption?: string
  }) => Promise<{ error: Error | null }>
  createTask: (title: string, description?: string) => Promise<{ error: Error | null; task?: Task }>
  deleteTask: (taskId: string) => Promise<{ error: Error | null }>
  completeTask: (taskId: string, photo: File, caption?: string) => Promise<{ error: Error | null }>
  uncompleteTask: (taskId: string, completionId: string) => Promise<{ error: Error | null }>
}

const defaultWebsiteData: WebsiteData = {
  profile: null,
  tasks: [],
  posts: [],
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

  // Helper function to calculate current streak from completion dates
  const calculateCurrentStreak = useCallback((completionDates: string[]): number => {
    if (completionDates.length === 0) return 0

    // Convert to date strings and sort (most recent first)
    const sortedDates = [...new Set(completionDates)]
      .map(d => new Date(d).toISOString().split('T')[0])
      .sort((a, b) => b.localeCompare(a))

    const today = new Date().toISOString().split('T')[0]
    const dateSet = new Set(sortedDates)

    // If not completed today, streak is 0
    if (!dateSet.has(today)) {
      return 0
    }

    // Calculate consecutive days from today backwards
    let streak = 0
    let checkDate = new Date(today)
    
    // Check up to 1000 days back (safety limit)
    for (let i = 0; i < 1000; i++) {
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      if (dateSet.has(checkDateStr)) {
        streak++
        // Go back one day
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break // Streak broken
      }
    }

    return streak
  }, [])

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
      const today = new Date().toISOString().split('T')[0]
      const tasksWithStatus = tasksData.map((task: any) => {
        const completions = completionsByTask.get(task.id) || []
        const completionDates = completions.map((c: any) => c.completed_on)
        
        // Find today's completion if it exists
        const todayCompletion = completions.find(
          (tc: any) => tc.completed_on === today
        )

        // Calculate current streak
        const currentStreak = calculateCurrentStreak(completionDates)

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
  }, [calculateCurrentStreak])

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
      ])

      console.log('[WebsiteContext] Website data load complete')
    } catch (err) {
      console.error('[WebsiteContext] Error in fetchWebsiteData:', err)
      setError(err instanceof Error ? err.message : 'Failed to load website data')
    } finally {
      setLoading(false)
    }
  }, [user, fetchProfile, fetchTasks, fetchPosts])

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

      // 1. Upload photo to Supabase Storage
      const timestamp = Date.now()
      const fileExt = photo.name.split('.').pop()
      const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(filePath, photo, {
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
      const today = new Date().toISOString().split('T')[0]
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
  }, [user, websiteData.tasks, refetchTasks, refetchPosts])

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

  const value: WebsiteContextType = {
    profile: websiteData.profile,
    tasks: websiteData.tasks,
    posts: websiteData.posts,
    loading,
    error,
    refetchProfile,
    refetchTasks,
    refetchPosts,
    updateProfile,
    createTask,
    deleteTask,
    completeTask,
    uncompleteTask,
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
