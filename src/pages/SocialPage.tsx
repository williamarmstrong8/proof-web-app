import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PostFeed } from '../components/PostFeed'
import { FriendsSidebar } from '../components/FriendsSidebar'
import './SocialPage.css'

export function SocialPage() {
  const navigate = useNavigate()
  // Mock friends data
  const friends = [
    {
      id: '1',
      name: 'Sarah Chen',
      username: '@sarahchen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      streak: 15,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      username: '@marcusj',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      streak: 22,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      username: '@emmar',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      streak: 8,
      isOnline: true,
    },
    {
      id: '4',
      name: 'David Kim',
      username: '@davidk',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      streak: 31,
      isOnline: true,
    },
    {
      id: '5',
      name: 'Olivia Taylor',
      username: '@oliviat',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      streak: 12,
      isOnline: false,
    },
    {
      id: '6',
      name: 'James Wilson',
      username: '@jamesw',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      streak: 19,
      isOnline: true,
    },
  ]

  // Mock friends posts data - each post represents a task completion with photo proof
  const posts = [
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        username: '@sarahchen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Morning Run',
      proofImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 5,
    },
    {
      id: '2',
      user: {
        name: 'Marcus Johnson',
        username: '@marcusj',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Read for 30 minutes',
      proofImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop',
      timestamp: '4 hours ago',
      likes: 18,
      comments: 3,
    },
    {
      id: '3',
      user: {
        name: 'Emma Rodriguez',
        username: '@emmar',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Meditation',
      proofImage: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=600&fit=crop',
      timestamp: '6 hours ago',
      likes: 32,
      comments: 8,
    },
    {
      id: '4',
      user: {
        name: 'David Kim',
        username: '@davidk',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Team Workout',
      proofImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop',
      timestamp: '8 hours ago',
      likes: 45,
      comments: 12,
    },
    {
      id: '5',
      user: {
        name: 'Olivia Taylor',
        username: '@oliviat',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Water Intake Goal',
      proofImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
      timestamp: '10 hours ago',
      likes: 15,
      comments: 2,
    },
    {
      id: '6',
      user: {
        name: 'James Wilson',
        username: '@jamesw',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      task: 'Journaling',
      proofImage: 'https://images.unsplash.com/photo-1538805060514-97d9cc90893b?w=800&h=600&fit=crop',
      timestamp: '12 hours ago',
      likes: 28,
      comments: 6,
    },
  ]

  return (
    <div className="social-page">
      <div className="social-content">
        <div className="social-header">
          <div className="social-header-left">
            <h1 className="social-title">Social</h1>
            <p className="social-subtitle">Proof of progress from your friends</p>
          </div>
          <button 
            className="social-add-friends-button"
            onClick={() => navigate('/add-friends')}
            aria-label="Add friends"
          >
            <UserPlus size={20} />
            Add Friends
          </button>
        </div>
        
        <div className="social-main">
          <FriendsSidebar friends={friends} />
          
          <div className="social-feed-container">
            <PostFeed posts={posts} />
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

