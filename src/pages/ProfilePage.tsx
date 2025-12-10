import { BottomNav } from '../components/BottomNav'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostGrid } from '../components/PostGrid'
import { HabitHistory } from '../components/HabitHistory'
import { useWebsite } from '../lib/WebsiteContext'
import './ProfilePage.css'

export function ProfilePage() {
  const { profile, tasks, partnerTasks, posts, loading } = useWebsite()

  // Convert tasks to habit history format (using real data from database)
  const taskHabits = tasks.map(task => ({
    id: task.id,
    name: task.title,
    streak: task.current_streak || 0,
    total: task.total_completions || 0,
    color: '#000',
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

