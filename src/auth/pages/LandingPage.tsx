import { LoginButton } from '../components/LoginButton'
import { SignUpButton } from '../components/SignUpButton'
import './LandingPage.css'

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-background">
        <div className="landing-overlay"></div>
      </div>
      
      <div className="landing-content">
        <div className="landing-text">
          <h1 className="landing-title">Proof</h1>
          <p className="landing-subtitle">over perfection</p>
        </div>
        
        <div className="landing-actions">
          <LoginButton />
          <SignUpButton />
        </div>
      </div>
    </div>
  )
}

