import { BottomNav } from '../components/BottomNav'
import { ProfileHeader } from '../components/ProfileHeader'
import { PostGrid } from '../components/PostGrid'
import { HabitHistory } from '../components/HabitHistory'
import { useWebsite } from '../lib/WebsiteContext'
import './ProfilePage.css'

export function ProfilePage() {
  const { profile, tasks, posts, loading } = useWebsite()

  // Convert tasks to habit history format (using real data from database)
  const habits = tasks.map(task => ({
    id: task.id,
    name: task.title,
    streak: task.current_streak || 0,
    total: task.total_completions || 0,
    color: '#000',
  }))

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
      posts: posts.length, // Real posts count from database
      habits: tasks.length, // Real habits count from database
      streak: Math.max(...tasks.map(t => t.current_streak || 0), 0), // Longest current streak
    },
  }

  return (
    <div className="profile-page">
      <div className="profile-content">
        <ProfileHeader userData={userData} />
        
        <div className="profile-sections">
          <HabitHistory habits={habits} />
          <PostGrid posts={posts} />
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

