import { useNavigate } from 'react-router-dom'
import { CustomDock } from './CustomDock'
import { Home, Trophy, Users, User } from 'lucide-react'

export function BottomNav() {
  const navigate = useNavigate()

  const items = [
    {
      icon: Home,
      label: 'Home',
      onClick: () => navigate('/home'),
    },
    {
      icon: Trophy,
      label: 'Challenges',
      onClick: () => navigate('/challenges'),
    },
    {
      icon: Users,
      label: 'Social',
      onClick: () => navigate('/social'),
    },
    {
      icon: User,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none" style={{ position: 'fixed', bottom: 0 }}>
      <div className="pointer-events-auto w-full max-w-2xl px-4 pb-4">
        <CustomDock items={items} className="h-auto" />
      </div>
    </nav>
  )
}

