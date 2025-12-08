import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  dob: string | null
  avatar_url: string | null
  caption: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signup: (email: string, password: string) => Promise<{ error: Error | null }>
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state - runs only once on mount
  // Supabase automatically caches session in localStorage, so getSession() is fast
  useEffect(() => {
    let mounted = true

    console.log('[AuthProvider] Checking cached session from localStorage')
    // Get initial session (uses cached session from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      console.log('[AuthProvider] Session check complete:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // Don't fetch profile here - WebsiteContext will handle it
    })

    // Listen for auth changes (sign in, sign out, token refresh)
    // Ignore INITIAL_SESSION event since we already handle it with getSession()
    // This prevents duplicate state updates and unnecessary re-renders
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore INITIAL_SESSION - we already handled initial state with getSession()
      // This event fires right after the listener is set up and causes duplicate updates
      if (event === 'INITIAL_SESSION') {
        return
      }

      console.log('[AuthProvider] Auth state changed:', event)
      
      try {
        // Only set loading for actual state changes (login/logout), not token refreshes
        // Token refresh happens silently in the background and shouldn't show loading
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(true)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        // Don't fetch profile here - WebsiteContext will handle it
      } catch (err) {
        console.error('[AuthProvider] Error in auth state change:', err)
      } finally {
        // Only reset loading if we set it (for SIGNED_IN/OUT)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signup = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (!data.user) {
        return { error: new Error('Failed to create user') }
      }

      // Wait for session to be available (Supabase may need a moment)
      let retries = 0
      let session = data.session

      while (!session && retries < 5) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const { data: sessionData } = await supabase.auth.getSession()
        session = sessionData.session
        retries++
      }

      if (!session) {
        // User created but no session yet - this is OK, they'll confirm email
        // Profile will be created when they complete the profile page
        return { error: null }
      }

      // Profile will be created on the create-profile page with additional info
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Signup failed') }
    }
  }

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') }
    }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    // Profile will be cleared by WebsiteContext when user becomes null
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
