import { useState, useEffect } from 'react'
import { BottomNav } from '../components/BottomNav'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostGrid } from '../components/PostGrid'
import { HabitHistory } from '../components/HabitHistory'
import { useWebsite } from '../lib/WebsiteContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import './ProfilePage.css'

export function ProfilePage() {
  const { profile, tasks, partnerTasks, posts, friends, loading } = useWebsite()
  const { user } = useAuth()
  const [completionDatesMap, setCompletionDatesMap] = useState<Map<string, (Date | string)[]>>(new Map())

  // Fetch completion dates for all habits
  useEffect(() => {
    if (!user?.id || loading) return

    const fetchCompletionDates = async () => {
      const datesMap = new Map<string, (Date | string)[]>()

      // Fetch completion dates for regular tasks
      if (tasks.length > 0) {
        const taskIds = tasks.map(t => parseInt(t.id))
        const { data: taskCompletions } = await supabase
          .from('task_completions')
          .select('task_id, completed_on')
          .eq('user_id', user.id)
          .in('task_id', taskIds)

        if (taskCompletions) {
          taskCompletions.forEach((completion: any) => {
            const taskId = completion.task_id.toString()
            if (!datesMap.has(taskId)) {
              datesMap.set(taskId, [])
            }
            const date = completion.completed_on
            datesMap.get(taskId)!.push(date)
          })
        }
      }

      // Fetch completion dates for partner tasks
      const acceptedPartnerTasks = partnerTasks.filter(pt => pt.status === 'accepted')
      if (acceptedPartnerTasks.length > 0) {
        const partnerTaskIds = acceptedPartnerTasks.map(pt => parseInt(pt.id))
        
        // Get all completions for these partner tasks
        const { data: partnerCompletions } = await supabase
          .from('partner_task_completions')
          .select('partner_task_id, profile_id, completion_date')
          .in('partner_task_id', partnerTaskIds)

        if (partnerCompletions) {
          // Group by task and date to find dates where both users completed
          const completionsByTaskAndDate = new Map<string, Set<string>>()
          partnerCompletions.forEach((completion: any) => {
            const key = `${completion.partner_task_id}_${completion.completion_date}`
            if (!completionsByTaskAndDate.has(key)) {
              completionsByTaskAndDate.set(key, new Set())
            }
            completionsByTaskAndDate.get(key)!.add(completion.profile_id)
          })

          // For each partner task, find dates where both users completed
          acceptedPartnerTasks.forEach(partnerTask => {
            const taskId = `partner-${partnerTask.id}`
            const otherUserId = partnerTask.other_user_id
            
            if (!otherUserId) return

            const bothCompletedDates: (Date | string)[] = []
            const seenDates = new Set<string>()

            completionsByTaskAndDate.forEach((profileIds, key) => {
              const [taskIdStr, date] = key.split('_')
              if (parseInt(taskIdStr) === parseInt(partnerTask.id) && !seenDates.has(date)) {
                seenDates.add(date)
                const hasCurrentUser = profileIds.has(user.id)
                const hasPartner = profileIds.has(otherUserId)
                if (hasCurrentUser && hasPartner) {
                  bothCompletedDates.push(date)
                }
              }
            })

            datesMap.set(taskId, bothCompletedDates)
          })
        }
      }

      setCompletionDatesMap(datesMap)
    }

    fetchCompletionDates()
  }, [user?.id, tasks, partnerTasks, loading])

  // Convert tasks to habit history format (using real data from database)
  const taskHabits = tasks.map(task => ({
    id: task.id,
    name: task.title,
    streak: task.current_streak || 0,
    total: task.total_completions || 0,
    color: '#000',
    completionDates: completionDatesMap.get(task.id) || [],
  }))

  // Convert partner tasks to habit history format
  const partnerHabits = partnerTasks
    .filter(pt => pt.status === 'accepted') // Only show accepted partner tasks
    .map(partnerTask => ({
      id: `partner-${partnerTask.id}`,
      name: partnerTask.title,
      streak: partnerTask.current_streak || 0,
      total: partnerTask.total_completions || 0,
      color: '#000',
      completionDates: completionDatesMap.get(`partner-${partnerTask.id}`) || [],
    }))

  // Combine both types of habits
  const habits = [...taskHabits, ...partnerHabits]

  // Show loading state only if still actively loading
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-content">
          <div className="profile-loading-container">
            <div className="profile-loading-spinner"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // If no profile exists, show message to create one
  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>No profile found</h2>
            <p>Please complete your profile first.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Use profile data from WebsiteContext (only called if profile exists)
  const userData = {
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User',
    username: profile.username ? `@${profile.username}` : '@username',
    avatarUrl: profile.avatar_url,
    bio: profile.caption || 'Tracking habits and sharing moments. Proof over perfection.',
    stats: {
      posts: posts.length, // Real posts count from database (includes partner task completions)
      habits: tasks.length + partnerTasks.filter(pt => pt.status === 'accepted').length, // Real habits count (tasks + partner tasks)
      streak: Math.max(
        ...tasks.map(t => t.current_streak || 0),
        ...partnerTasks.filter(pt => pt.status === 'accepted').map(pt => pt.current_streak || 0),
        0
      ), // Longest current streak across all tasks
      friends: friends.length, // Friend count
    },
  }

  return (
    <div className="profile-page">
      <div className="profile-content">
        <ProfileHeader userData={userData} />
        
        <div className="profile-sections">
          {habits.length > 0 ? (
            <HabitHistory habits={habits} />
          ) : (
            <div className="habit-history-section">
              <h2 className="habit-history-title">Habit History</h2>
              <div className="habit-item habit-item-bronze" style={{ 
                padding: '24px',
                background: 'hsl(var(--card))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '0'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                    margin: '0 0 12px 0'
                  }}>
                    What is Habit History?
                  </h3>
                  <p style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'hsl(var(--muted-foreground))',
                    margin: 0
                  }}>
                    Habit History tracks your daily task completions and shows your progress over time. 
                    Each habit displays your current streak (consecutive days completed) and total completions. 
                    As you build longer streaks, you'll unlock different tiers: Bronze (0-4 days), Silver (5-24 days), 
                    and Gold (25+ days). Start completing tasks to see your habits appear here!
                  </p>
                </div>
                <div className="habit-progress-container">
                  <div 
                    className="habit-progress-bar habit-progress-bar-bronze"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {posts.length > 0 ? (
            <PostGrid 
              posts={posts}
              user={{
                id: profile.id,
                name: userData.name,
                username: userData.username,
                avatar: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`,
              }}
            />
          ) : (
            <div className="post-grid-section">
              <h2 className="post-grid-title">Posts</h2>
              <div className="post-grid">
                <div 
                  className="post-item"
                  style={{ cursor: 'default' }}
                >
                  <div className="post-image-container">
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--border)) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: 'hsl(var(--muted-foreground))',
                        zIndex: 1
                      }}>
                        <div style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '8px',
                          color: 'hsl(var(--foreground))'
                        }}>
                          📸
                        </div>
                        <div style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '12px',
                          opacity: 0.8
                        }}>
                          Your proof photos will appear here
                        </div>
                      </div>
                      <div className="post-overlay" style={{ background: 'rgba(0, 0, 0, 0)' }}>
                        <span className="post-date" style={{ color: 'rgba(255, 255, 255, 0)' }}>
                          Example
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

