'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/clientStorage'

export interface User {
  id: string
  email?: string
  phone?: string
  role?: string // Add role field for admin checks
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
    country?: string
    language?: string
  }
  subscription?: {
    id: string
    status: string
    planId: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef<User | null>(null) // Track current user in ref

  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let mounted = true
    let hasLoaded = false
    
    // Load user from API on mount
    const loadUser = async (force = false) => {
      if (!mounted || (hasLoaded && !force)) return
      hasLoaded = true
      
      try {
        const currentUser = await authService.getCurrentUser()
        if (mounted) {
          setUser(currentUser as User | null)
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }
    
    loadUser()

    // Listen for storage changes (for multi-tab sync and same-tab updates)
    let lastUserId: string | null = null
    const handleStorageChange = async () => {
      if (!mounted) return
      
      // Reset hasLoaded flag to allow reload
      hasLoaded = false
      
      // Get current user from ref (always up-to-date)
      const currentUser = userRef.current
      const currentUserId = currentUser?.id || null
      
      // Clear auth-checked flag to force fresh check
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-checked')
      }
      
      try {
        const updatedUser = await authService.getCurrentUser()
        if (mounted) {
          // Always update user state when storage changes
          setUser(updatedUser as User | null)
          setLoading(false)
          lastUserId = updatedUser?.id || null
        }
      } catch (error) {
        // Ignore errors, but set loading to false
        if (mounted) {
          setUser(null)
          setLoading(false)
          lastUserId = null
        }
      }
    }

    // Listen to both storage events (cross-tab) and custom events (same-tab)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleStorageChange)
    
    // Debounced focus handler to prevent excessive reloads
    // Only reload if we have a user (might have logged out in another tab)
    let focusTimeout: NodeJS.Timeout | null = null
    const handleFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout)
      focusTimeout = setTimeout(() => {
        if (mounted && userRef.current) {
          // Only reload if we think we have a user (might have logged out elsewhere)
          loadUser()
        }
      }, 1000) // Increased delay to prevent excessive reloads
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      mounted = false
      if (focusTimeout) clearTimeout(focusTimeout)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, []) // Only run once on mount

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const result = await authService.login(emailOrPhone, password)
      // Clear auth-checked flag to allow fresh API check
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-checked')
      }
      // Update user state immediately
      setUser(result.user as User)
      // Also trigger a reload to ensure all components update
      const updatedUser = await authService.getCurrentUser()
      if (updatedUser) {
        setUser(updatedUser as User)
      }
      return result
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const signup = async (data: {
    email?: string
    phone?: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    try {
      const result = await authService.signup(data)
      setUser(result.user as User)
      return result
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed')
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    router.push('/')
  }

  const updateProfile = (updates: any) => {
    const updated = authService.updateProfile(updates)
    if (updated) {
      setUser(updated as User)
    }
    return updated
  }

  return {
    user,
    loading,
    error: null,
    login,
    signup,
    logout,
    updateProfile,
    mutate: () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser as User | null)
    },
  }
}

