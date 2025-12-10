import { useEffect, useState, useRef } from 'react'
import logo from '../images/Proof Logo.svg'
import './LoadingScreen.css'

interface LoadingScreenProps {
  isLoading: boolean
}

const MINIMUM_DISPLAY_DURATION = 2000 // 2 seconds

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(true)
  const [logoFadeOut, setLogoFadeOut] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoFadeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousLoadingRef = useRef<boolean>(true)

  useEffect(() => {
    // Clear any existing timers
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current)
      fadeOutTimerRef.current = null
    }
    if (logoFadeTimerRef.current) {
      clearTimeout(logoFadeTimerRef.current)
      logoFadeTimerRef.current = null
    }

    // If loading, keep showing and reset start time when loading starts
    if (isLoading) {
      setShouldShow(true)
      setLogoFadeOut(false)
      // Reset start time when loading begins (including after login)
      startTimeRef.current = Date.now()
      previousLoadingRef.current = true
      return
    }

    // If not loading and was previously loading (loading just completed)
    // Reset start time to now to ensure 2 seconds from completion
    if (previousLoadingRef.current && !isLoading) {
      startTimeRef.current = Date.now()
    }
    previousLoadingRef.current = isLoading

    // If not loading, calculate remaining time to reach 2 seconds
    if (startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, MINIMUM_DISPLAY_DURATION - elapsed)

      if (remaining > 0) {
        // Start logo fade out first (0.3s before screen fade)
        const logoFadeOutTime = Math.max(0, remaining - 300)
        logoFadeTimerRef.current = setTimeout(() => {
          setLogoFadeOut(true)
        }, logoFadeOutTime)

        // Then fade out the screen
        fadeOutTimerRef.current = setTimeout(() => {
          setShouldShow(false)
        }, remaining)
      } else {
        // Already been 2+ seconds, fade out immediately
        setLogoFadeOut(true)
        fadeOutTimerRef.current = setTimeout(() => {
          setShouldShow(false)
        }, 300)
      }
    }

    return () => {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current)
      }
      if (logoFadeTimerRef.current) {
        clearTimeout(logoFadeTimerRef.current)
      }
    }
  }, [isLoading])

  return (
    <div className={`loading-screen ${shouldShow ? '' : 'fade-out'}`}>
      <div className="loading-screen-content">
        <img 
          src={logo} 
          alt="Proof" 
          className={`loading-screen-logo ${logoFadeOut ? 'logo-fade-out' : ''}`}
        />
      </div>
    </div>
  )
}
