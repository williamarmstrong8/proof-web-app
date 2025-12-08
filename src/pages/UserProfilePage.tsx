import { useParams, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { UserProfileHeader } from '../components/UserProfileHeader'
import { PostGrid } from '../components/PostGrid'
import { HabitHistory } from '../components/HabitHistory'
import './UserProfilePage.css'

// Mock user data - in real app, this would come from an API based on userId
const mockUsers: Record<string, any> = {
  'sarahchen': {
    id: 'sarahchen',
    name: 'Sarah Chen',
    username: '@sarahchen',
    bio: 'Fitness enthusiast | Habit tracker | Proof over perfection',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    stats: {
      posts: 32,
      habits: 6,
      streak: 45,
    },
    posts: [
      { id: 'p1', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', date: '2024-01-15' },
      { id: 'p2', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop', date: '2024-01-14' },
      { id: 'p3', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=400&fit=crop', date: '2024-01-13' },
      { id: 'p4', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', date: '2024-01-12' },
      { id: 'p5', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc90893b?w=400&h=400&fit=crop', date: '2024-01-11' },
      { id: 'p6', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&fit=crop', date: '2024-01-10' },
    ],
    habits: [
      { id: 'h1', name: 'Morning Run', streak: 45, total: 50, color: '#000' },
      { id: 'h2', name: 'Read for 30 minutes', streak: 38, total: 45, color: '#000' },
      { id: 'h3', name: 'Meditation', streak: 30, total: 40, color: '#000' },
      { id: 'h4', name: 'Water intake goal', streak: 25, total: 30, color: '#000' },
    ],
  },
  'marcusj': {
    id: 'marcusj',
    name: 'Marcus Johnson',
    username: '@marcusj',
    bio: 'Building better habits one day at a time',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    stats: {
      posts: 18,
      habits: 5,
      streak: 22,
    },
    posts: [
      { id: 'p1', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop', date: '2024-01-15' },
      { id: 'p2', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', date: '2024-01-12' },
      { id: 'p3', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc90893b?w=400&h=400&fit=crop', date: '2024-01-10' },
    ],
    habits: [
      { id: 'h1', name: 'Read for 30 minutes', streak: 22, total: 30, color: '#000' },
      { id: 'h2', name: 'Exercise', streak: 15, total: 25, color: '#000' },
      { id: 'h3', name: 'Journaling', streak: 10, total: 15, color: '#000' },
    ],
  },
  'emmar': {
    id: 'emmar',
    name: 'Emma Rodriguez',
    username: '@emmar',
    bio: 'Mindful living and continuous improvement',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    stats: {
      posts: 28,
      habits: 7,
      streak: 35,
    },
    posts: [
      { id: 'p1', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=400&fit=crop', date: '2024-01-15' },
      { id: 'p2', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop', date: '2024-01-14' },
      { id: 'p3', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', date: '2024-01-13' },
      { id: 'p4', image: 'https://images.unsplash.com/photo-1538805060514-97d9cc90893b?w=400&h=400&fit=crop', date: '2024-01-12' },
    ],
    habits: [
      { id: 'h1', name: 'Meditation', streak: 35, total: 40, color: '#000' },
      { id: 'h2', name: 'Yoga', streak: 28, total: 35, color: '#000' },
      { id: 'h3', name: 'Reading', streak: 20, total: 25, color: '#000' },
    ],
  },
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  // Get user data - in real app, fetch from API
  const userData = userId ? mockUsers[userId] : null

  if (!userData) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-content">
          <p>User not found</p>
          <button onClick={() => navigate('/social')}>Back to Social</button>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-content">
        <UserProfileHeader userData={userData} />
        
        <div className="user-profile-sections">
          <HabitHistory habits={userData.habits} />
          <PostGrid posts={userData.posts} />
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

