import './UserHeader.css'

interface UserHeaderProps {
  userName: string
}

export function UserHeader({ userName }: UserHeaderProps) {
  return (
    <div className="user-header">
      <div className="user-header-content">
        <h1 className="user-greeting">Hello, {userName}</h1>
        <p className="user-subtitle">Track your habits and connect</p>
      </div>
    </div>
  )
}

