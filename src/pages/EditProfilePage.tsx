import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useWebsite } from '../lib/WebsiteContext'
import { useAuth } from '../lib/auth'
import './EditProfilePage.css'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading, updateProfile } = useWebsite()
  const { logout } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dob: '',
    caption: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        username: profile.username || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '', // Format date for input
        caption: profile.caption || '',
      })
    }
  }, [profile])

  // Redirect if no profile exists after loading completes
  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate('/create-profile', { replace: true })
    }
  }, [profileLoading, profile, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null) // Clear error when user types
  }

  const handleSave = async () => {
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required')
      setLoading(false)
      return
    }

    if (!formData.username.trim()) {
      setError('Username is required')
      setLoading(false)
      return
    }

    try {
      const updateData: {
        first_name?: string
        last_name?: string
        username?: string
        dob?: string
        caption?: string
      } = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        username: formData.username.trim(),
      }

      // Only include dob if it's provided
      if (formData.dob) {
        updateData.dob = new Date(formData.dob).toISOString()
      }

      // Include caption (can be empty string to clear it)
      updateData.caption = formData.caption.trim() || undefined

      console.log('[EditProfilePage] Updating profile:', updateData)
      const { error: updateError } = await updateProfile(updateData)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Profile is automatically refetched by WebsiteContext after update
      // Navigate back to profile
      navigate('/profile')
    } catch (err) {
      console.error('[EditProfilePage] Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  // Show loading spinner while profile is loading
  if (profileLoading || !profile) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-wrapper">
          <div className="edit-profile-content">
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="edit-profile-loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get initials for avatar display
  const firstInitial = formData.firstName.trim().charAt(0).toUpperCase() || ''
  const lastInitial = formData.lastName.trim().charAt(0).toUpperCase() || ''
  const initials = `${firstInitial}${lastInitial}` || 'U'

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-wrapper">
        <div className="edit-profile-header">
          <button className="edit-profile-back-button" onClick={handleCancel}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="edit-profile-title">Edit Profile</h1>
          <button 
            className="edit-profile-save-button" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="edit-profile-content">
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">Profile Photo</h2>
          <div className="edit-profile-avatar-section">
            <div className="edit-profile-avatar-container">
              <div className="edit-profile-avatar-initial">{initials}</div>
            </div>
            <p className="edit-profile-avatar-note">Avatar displays your initials</p>
          </div>
        </div>

        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">Basic Information</h2>
          {error && (
            <div className="edit-profile-error-message">
              {error}
            </div>
          )}
          <div className="edit-profile-form">
            <div className="edit-profile-form-row">
              <div className="edit-profile-form-group">
                <label htmlFor="firstName" className="edit-profile-label">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="edit-profile-input"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  disabled={loading}
                />
              </div>

              <div className="edit-profile-form-group">
                <label htmlFor="lastName" className="edit-profile-label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="edit-profile-input"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-profile-form-group">
              <label htmlFor="username" className="edit-profile-label">
                Username *
              </label>
              <div className="edit-profile-input-wrapper">
                <span className="edit-profile-username-prefix">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="edit-profile-input edit-profile-input-username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-profile-form-group">
              <label htmlFor="email" className="edit-profile-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="edit-profile-input"
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p className="edit-profile-help-text">Email cannot be changed</p>
            </div>

            <div className="edit-profile-form-group">
              <label htmlFor="dob" className="edit-profile-label">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                className="edit-profile-input"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="edit-profile-form-group">
              <label htmlFor="caption" className="edit-profile-label">
                Bio / Caption
              </label>
              <textarea
                id="caption"
                name="caption"
                className="edit-profile-textarea"
                value={formData.caption}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
                disabled={loading}
              />
              <p className="edit-profile-help-text">A short bio or caption about yourself</p>
            </div>
          </div>
        </div>

        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">Account</h2>
          <button 
            className="edit-profile-signout-button" 
            onClick={handleSignOut}
            type="button"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

