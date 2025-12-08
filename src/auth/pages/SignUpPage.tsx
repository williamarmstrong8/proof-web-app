import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './AuthPage.css'

export function SignUpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setPasswordError('')
    
    // Validate password match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // Session is available immediately (email confirmation disabled)
          navigate('/create-profile', { replace: true })
        } else {
          // Wait a bit and check again (in case of slight delay)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            navigate('/create-profile', { replace: true })
          } else {
            // Email confirmation is required
            setError('Please check your email to confirm your account. After confirming, you can log in to complete your profile.')
            setLoading(false)
          }
        }
      } else {
        setError('Failed to create account. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError('')
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError('')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>
      
      <div className="auth-container">
        <button 
          className="auth-back-button"
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          ←
        </button>
        
        <div className="auth-content">
          <h1 className="auth-title">Proof</h1>
          <p className="auth-subtitle">Create your account</p>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error-message" style={{ marginBottom: '16px' }}>
                {error}
            </div>
            )}
            
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`auth-input ${passwordError ? 'auth-input-error' : ''}`}
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`auth-input ${passwordError ? 'auth-input-error' : ''}`}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                disabled={loading}
              />
              {passwordError && (
                <span className="auth-error-message">{passwordError}</span>
              )}
            </div>
            
            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account?{' '}
            <button 
              className="auth-link-button"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

