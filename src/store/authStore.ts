import { create } from 'zustand'
import { User } from '../types'
import { supabase, getCurrentUser } from '../services/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ loading: true, error: null })

      // Get current session
      const { data, error } = await getCurrentUser()

      if (error || !data?.user) {
        set({ user: null, isAuthenticated: false, loading: false })
        return
      }

      // Set user from session
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name,
        created_at: data.user.created_at || new Date().toISOString(),
        updated_at: data.user.updated_at || new Date().toISOString(),
      }

      set({ user, isAuthenticated: true, loading: false })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    })
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  logout: async () => {
    try {
      set({ loading: true })
      await supabase.auth.signOut()
      set({ user: null, isAuthenticated: false, loading: false })
    } catch (error) {
      console.error('Error logging out:', error)
      set({ error: 'Failed to logout', loading: false })
    }
  },
}))

// Listen to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name,
        created_at: session.user.created_at || new Date().toISOString(),
        updated_at: session.user.updated_at || new Date().toISOString(),
      }
      useAuthStore.setState({ user, isAuthenticated: true })
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  }
})
