import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './AuthPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        console.log('[WebsiteContext] User logged in successfully, navigating to home')
        // Navigate immediately - don't wait for profile fetch
        // Let the destination page handle profile checking via WebsiteContext
        navigate('/home', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setLoading(false)
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
          <p className="auth-subtitle">Welcome back</p>
          
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
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account?{' '}
            <button 
              className="auth-link-button"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

