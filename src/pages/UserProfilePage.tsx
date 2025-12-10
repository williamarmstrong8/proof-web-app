import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { UserProfileHeader } from '../components/UserProfileHeader'
import { PostGrid } from '../components/PostGrid'
import { HabitHistory } from '../components/HabitHistory'
import { supabase } from '../lib/supabase'
import type { Profile, Post, Task } from '../lib/WebsiteContext'
import './UserProfilePage.css'

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [partnerTasks, setPartnerTasks] = useState<any[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided')
      setLoading(false)
      return
    }

    // Remove @ if present
    const username = userId.startsWith('@') ? userId.slice(1) : userId

    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!profileData) {
          setError('User not found')
          setLoading(false)
          return
        }

        setProfile(profileData as Profile)

        // Fetch tasks for this user
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('owner_id', profileData.id)
          .order('created_at', { ascending: false })

        if (tasksError) {
          console.error('[UserProfilePage] Error fetching tasks:', tasksError)
          console.error('[UserProfilePage] This might be due to RLS policies. Make sure users can view other users\' tasks.')
          setTasks([])
        } else {
          // Get completions for tasks to calculate streaks
          const taskIds = (tasksData || []).map(t => t.id)
          if (taskIds.length > 0) {
            const { data: completionsData } = await supabase
              .from('task_completions')
              .select('task_id, completed_on')
              .eq('user_id', profileData.id)
              .in('task_id', taskIds)

            // Calculate streaks and totals for each task
            const completionsByTask = new Map<number, string[]>()
            if (completionsData) {
              completionsData.forEach((c: any) => {
                if (!completionsByTask.has(c.task_id)) {
                  completionsByTask.set(c.task_id, [])
                }
                completionsByTask.get(c.task_id)!.push(c.completed_on)
              })
            }

            // Helper to get local date string (YYYY-MM-DD)
            const getLocalDateString = (): string => {
              const now = new Date()
              const year = now.getFullYear()
              const month = String(now.getMonth() + 1).padStart(2, '0')
              const day = String(now.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            }

            // Calculate current streak (simplified - same logic as WebsiteContext)
            const today = getLocalDateString()
            const calculateStreak = (dates: string[]): number => {
              if (dates.length === 0) return 0
              const sortedDates = [...new Set(dates)]
                .map(d => {
                  const date = new Date(d)
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')
                  return `${year}-${month}-${day}`
                })
                .sort((a, b) => b.localeCompare(a))
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

              let streak = 0
              let checkDate = new Date(startDate)
              for (let i = 0; i < 1000; i++) {
                const checkYear = checkDate.getFullYear()
                const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0')
                const checkDay = String(checkDate.getDate()).padStart(2, '0')
                const checkDateStr = `${checkYear}-${checkMonth}-${checkDay}`
                if (dateSet.has(checkDateStr)) {
                  streak++
                  checkDate.setDate(checkDate.getDate() - 1)
                } else {
                  break
                }
              }
              return streak
            }

            const tasksWithStreaks: Task[] = (tasksData || []).map((task: any) => {
              const completions = completionsByTask.get(task.id) || []
              return {
                id: task.id.toString(),
                owner_id: task.owner_id,
                title: task.title,
                description: task.description,
                created_at: task.created_at,
                updated_at: task.updated_at,
                current_streak: calculateStreak(completions),
                total_completions: completions.length,
              }
            })
            setTasks(tasksWithStreaks)
          } else {
            setTasks([])
          }
        }
        
        // Log if no tasks found (for debugging)
        if (!tasksError && (!tasksData || tasksData.length === 0)) {
          console.log('[UserProfilePage] No tasks found for user:', profileData.id)
        }

        // Fetch partner tasks for this user
        const { data: partnerTasksData, error: partnerTasksError } = await supabase
          .from('partner_tasks')
          .select('*')
          .in('status', ['pending', 'accepted'])
          .or(`creator_profile_id.eq.${profileData.id},and(partner_profile_id.eq.${profileData.id},status.eq.accepted)`)
          .order('created_at', { ascending: false })

        if (partnerTasksError) {
          console.error('[UserProfilePage] Error fetching partner tasks:', partnerTasksError)
          setPartnerTasks([])
        } else {
          // Get partner task completions to calculate streaks
          // For partner tasks, only count days where BOTH partners completed
          const partnerTaskIds = (partnerTasksData || []).map(pt => pt.id)
          if (partnerTaskIds.length > 0) {
            // Fetch ALL completions (both users) for these partner tasks
            const { data: allPartnerCompletionsData } = await supabase
              .from('partner_task_completions')
              .select('partner_task_id, profile_id, completion_date')
              .in('partner_task_id', partnerTaskIds)

            // Group completions by task and date to find days where both completed
            const completionsByTaskAndDate = new Map<string, Set<string>>() // key: "taskId_date", value: Set of profile_ids
            if (allPartnerCompletionsData) {
              allPartnerCompletionsData.forEach((c: any) => {
                const taskId = c.partner_task_id
                const date = c.completion_date
                const key = `${taskId}_${date}`
                if (!completionsByTaskAndDate.has(key)) {
                  completionsByTaskAndDate.set(key, new Set())
                }
                completionsByTaskAndDate.get(key)!.add(c.profile_id)
              })
            }

            const partnerTasksWithStreaks = (partnerTasksData || [])
              .filter(pt => pt.status === 'accepted') // Only show accepted partner tasks
              .map((task: any) => {
                const taskId = task.id
                const otherUserId = task.creator_profile_id === profileData.id
                  ? task.partner_profile_id
                  : task.creator_profile_id
                
                // Find dates where both users completed
                const bothCompletedDates: string[] = []
                const seenDates = new Set<string>()
                
                for (const [key, profileIds] of completionsByTaskAndDate.entries()) {
                  const [taskIdStr, date] = key.split('_')
                  if (parseInt(taskIdStr) === taskId && !seenDates.has(date)) {
                    seenDates.add(date)
                    // Check if both users completed on this date
                    const hasCurrentUser = profileIds.has(profileData.id)
                    const hasPartner = otherUserId ? profileIds.has(otherUserId) : false
                    if (hasCurrentUser && hasPartner) {
                      // Normalize date to YYYY-MM-DD format
                      const normalizedDate = typeof date === 'string' 
                        ? date.split('T')[0].trim()
                        : (() => {
                            const d = new Date(date)
                            const year = d.getFullYear()
                            const month = String(d.getMonth() + 1).padStart(2, '0')
                            const day = String(d.getDate()).padStart(2, '0')
                            return `${year}-${month}-${day}`
                          })()
                      bothCompletedDates.push(normalizedDate)
                    }
                  }
                }
                
                // Sort dates descending (most recent first)
                bothCompletedDates.sort((a, b) => b.localeCompare(a))
                
                return {
                  id: task.id.toString(),
                  title: task.title,
                  current_streak: calculateStreak(bothCompletedDates),
                  total_completions: bothCompletedDates.length, // Only count days where both completed
                  status: task.status,
                }
              })
            setPartnerTasks(partnerTasksWithStreaks)
          } else {
            setPartnerTasks([])
          }
        }

        // Fetch posts (task completions + partner task completions with photos) for this user
        const { data: taskPostsData, error: taskPostsError } = await supabase
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
          .eq('user_id', profileData.id)
          .not('photo_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50)

        // Fetch partner task completions (posts) for this user
        const { data: partnerPostsData, error: partnerPostsError } = await supabase
          .from('partner_task_completions')
          .select(`
            id,
            photo_url,
            completion_date,
            created_at,
            partner_task:partner_tasks (
              title,
              status
            )
          `)
          .eq('profile_id', profileData.id)
          .not('photo_url', 'is', null)
          .eq('partner_task.status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(50)

        if (taskPostsError) {
          console.error('Error fetching task posts:', taskPostsError)
        }

        if (partnerPostsError) {
          console.error('Error fetching partner task posts:', partnerPostsError)
        }

        // Transform task completions to Post format
        const taskPosts: Post[] = (taskPostsData || []).map((completion: any) => ({
          id: `task-${completion.id}`,
            image: completion.photo_url || '',
            date: completion.completed_on || completion.created_at,
            task_title: completion.task_title_snapshot || completion.tasks?.title || 'Task',
            caption: completion.caption,
          }))

        // Transform partner task completions to Post format
        const partnerPosts: Post[] = (partnerPostsData || []).map((completion: any) => ({
          id: `partner-${completion.id}`,
          image: completion.photo_url || '',
          date: completion.completion_date || completion.created_at,
          task_title: completion.partner_task?.title || 'Partner Task',
          caption: null,
        }))

        // Combine and sort by date (most recent first)
        const allPosts = [...taskPosts, ...partnerPosts].sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        }).slice(0, 50)

        setPosts(allPosts)

        setLoading(false)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user data')
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="profile-loading-spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading profile...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>{error || 'User not found'}</p>
          <button onClick={() => navigate('/social')}>Back to Social</button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Transform data for UserProfileHeader
  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.username || profile.email || 'User'

  const userData = {
    name: displayName,
    username: profile.username ? `@${profile.username}` : '@no-username',
    avatarUrl: profile.avatar_url || null,
    bio: profile.caption || 'Tracking habits and sharing moments. Proof over perfection.',
    stats: {
      posts: posts.length, // Includes partner task completions
      habits: tasks.length + partnerTasks.length, // Includes partner tasks
      streak: Math.max(
        ...tasks.map(t => t.current_streak || 0),
        ...partnerTasks.map(pt => pt.current_streak || 0),
        0
      ), // Longest streak across all tasks
    },
  }

  // Transform tasks to habit history format
  const taskHabits = tasks.map(task => ({
    id: task.id,
    name: task.title,
    streak: task.current_streak || 0,
    total: task.total_completions || 0,
    color: '#000',
  }))

  // Transform partner tasks to habit history format
  const partnerHabits = partnerTasks.map(partnerTask => ({
    id: `partner-${partnerTask.id}`,
    name: partnerTask.title,
    streak: partnerTask.current_streak || 0,
    total: partnerTask.total_completions || 0,
    color: '#000',
  }))

  // Combine both types of habits
  const habits = [...taskHabits, ...partnerHabits]

  return (
    <div className="user-profile-page">
      <div className="user-profile-content">
        <UserProfileHeader userData={userData} />
        
        <div className="user-profile-sections">
          <HabitHistory habits={habits} />
          <PostGrid 
            posts={posts}
            user={{
              id: profile.id,
              name: displayName,
              username: profile.username ? `@${profile.username}` : '@no-username',
              avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
            }}
          />
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
