import { useNavigate } from 'react-router-dom'
import './AuthButton.css'

interface SignUpButtonProps {
  onClick?: () => void
}

export function SignUpButton({ onClick }: SignUpButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate('/signup')
    }
  }

  return (
    <button className="auth-button auth-button-primary" onClick={handleClick}>
      Sign Up
    </button>
  )
}

