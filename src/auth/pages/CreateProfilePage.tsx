import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useWebsite } from '../../lib/WebsiteContext'
import './AuthPage.css'

export function CreateProfilePage() {
  const navigate = useNavigate()
  const { profile: websiteProfile, loading: websiteLoading, refetchProfile } = useWebsite()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dob: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Wait for website context to load
    if (websiteLoading) {
      return
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.user) {
          navigate('/signup', { replace: true })
          return
        }

        // Check if profile already exists and is complete using WebsiteContext
        if (websiteProfile && websiteProfile.first_name && websiteProfile.username) {
          navigate('/home', { replace: true })
          return
        }

        // Profile doesn't exist or is incomplete, allow access to form
        setCheckingAuth(false)
      } catch (err) {
        console.error('Error checking auth:', err)
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [navigate, websiteProfile, websiteLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError('You must be logged in to create a profile')
        navigate('/signup')
        return
      }

      // Check if username is already taken
      // Note: RLS only allows viewing own profile, so we'll check after insertion
      // If there's a unique constraint violation, it means username is taken

      // Wait a moment to ensure the auth.users record is fully created
      // The trigger should create the profile, but we use upsert as a fallback
      await new Promise(resolve => setTimeout(resolve, 500))

      // Upsert profile with user data (will insert if trigger didn't run, update if it did)
      console.log('[Supabase] Upserting to profiles table:', {
        userId: session.user.id,
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      })
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email || '',
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          username: formData.username.trim(),
          dob: formData.dob || null,
        }, {
          onConflict: 'id'
        })
      
      if (!updateError) {
        console.log('[Supabase] Profile upsert successful')
      }

      if (updateError) {
        // Check for unique constraint violation (username taken)
        if (updateError.code === '23505' && updateError.message.includes('username')) {
          setError('Username is already taken. Please choose another.')
          setLoading(false)
          return
        }
        
        // If foreign key constraint error, wait a bit longer and retry
        if (updateError.message.includes('foreign key') || updateError.code === '23503') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('[Supabase] Retrying profile upsert after foreign key error')
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email || '',
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              username: formData.username.trim(),
              dob: formData.dob || null,
            }, {
              onConflict: 'id'
            })
          
          if (!retryError) {
            console.log('[Supabase] Profile upsert retry successful')
          }
          if (retryError) {
            // Check for username conflict on retry
            if (retryError.code === '23505' && retryError.message.includes('username')) {
              setError('Username is already taken. Please choose another.')
              setLoading(false)
              return
            }
            throw retryError
          }
        } else {
          throw updateError
        }
      }

      // Refetch profile data in WebsiteContext
      await refetchProfile()

      // Navigate to home page
      navigate('/home')
    } catch (err) {
      console.error('Error creating profile:', err)
      if (err instanceof Error) {
        if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
          setError('Username is already taken. Please choose another.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to create profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="auth-overlay"></div>
        </div>
        <div className="auth-container">
          <div className="auth-content">
            <div style={{ textAlign: 'center' }}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>
      
      <div className="auth-container">
        <button 
          className="auth-back-button"
          onClick={() => navigate('/signup')}
          aria-label="Go back"
        >
          ←
        </button>
        
        <div className="auth-content">
          <h1 className="auth-title">Proof</h1>
          <p className="auth-subtitle">Complete your profile</p>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error-message" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}
            
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label htmlFor="firstName" className="auth-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="auth-input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="auth-form-group">
                <label htmlFor="lastName" className="auth-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="auth-input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="username" className="auth-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="auth-input"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="dob" className="auth-label">Date of Birth</label>
              <input
                type="date"
                id="dob"
                name="dob"
                className="auth-input"
                value={formData.dob}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

