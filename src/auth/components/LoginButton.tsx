import { useNavigate } from 'react-router-dom'
import './AuthButton.css'

interface LoginButtonProps {
  onClick?: () => void
}

export function LoginButton({ onClick }: LoginButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate('/login')
    }
  }

  return (
    <button className="auth-button auth-button-secondary" onClick={handleClick}>
      Login
    </button>
  )
}

