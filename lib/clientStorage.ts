// Client-side localStorage service
// This runs in the browser and uses localStorage directly

'use client'

import { userStorage, watchHistoryStorage, watchListStorage, reviewsStorage, subscriptionStorage, profileStorage } from './localStorage'
// Removed mock data - using real API

// Initialize on client
if (typeof window !== 'undefined') {
  userStorage.init()
}

// Auth service
export const authService = {
  getCurrentUser: async () => {
    // First check localStorage for cached user
    const cachedUser = userStorage.getCurrentUser()
    
    // If no cached user, try API once to check if there's a valid session
    // But only if we haven't already checked (to prevent infinite loops)
    if (!cachedUser) {
      // Check if we've already tried and failed (stored in sessionStorage)
      const hasChecked = typeof window !== 'undefined' && sessionStorage.getItem('auth-checked')
      if (hasChecked) {
        return null // Already checked, no user
      }
      
      // Mark that we're checking
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth-checked', 'true')
      }
      
      // Try API once (silently - 401 is expected when not logged in)
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          const user = data.user
          if (user) {
            userStorage.setCurrentUser(user)
            // Clear the check flag since we found a user
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('auth-checked')
            }
            return user
          }
        }
        
        // 401 (Unauthorized) is expected when not logged in - not an error
        // Only log actual errors (500, network failures, etc.)
        if (response.status !== 401 && response.status !== 404) {
          console.warn('Unexpected auth check response:', response.status)
        }
        
        // 401 or no user - clear check flag and return null
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-checked')
        }
        return null
      } catch (error) {
        // Network error - clear check flag and return null
        // Only log if it's not a network error (which is expected in some cases)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - expected in some cases, don't log
        } else {
          console.warn('Auth check error:', error)
        }
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-checked')
        }
        return null
      }
    }
    
    // We have a cached user - verify it's still valid
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        // Update cache
        if (user) {
          userStorage.setCurrentUser(user)
        }
        return user
      } else if (response.status === 401) {
        // Token expired - clear cache
        userStorage.setCurrentUser(null)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth-checked', 'true')
        }
        return null
      } else {
        // Other error - return cached user
        return cachedUser
      }
    } catch (error) {
      // Network error - return cached user
      return cachedUser
    }
  },

  login: async (emailOrPhone: string, password: string) => {
    // Call the API endpoint to authenticate
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ emailOrPhone, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const result = await response.json()
    const user = result.user

    // Also save to localStorage for client-side access
    userStorage.setCurrentUser(user)
    
    // Clear auth-checked flag to allow fresh API checks
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-checked')
    }
    
    // Don't auto-restore profile - always require selection
    // Clear any existing profile selection to force profile selection screen
    profileStorage.setCurrentProfile(null, user.id)
    
    // Trigger custom event for same-tab sync (use CustomEvent for better compatibility)
    if (typeof window !== 'undefined') {
      // Dispatch multiple events to ensure all listeners catch it
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { user } }))
      window.dispatchEvent(new CustomEvent('profile-change'))
      // Also trigger storage event for multi-tab sync
      const storageEvent = new StorageEvent('storage', {
        key: 'auth-change',
        newValue: JSON.stringify(user),
      })
      window.dispatchEvent(storageEvent)
    }
    
    return { user }
  },

  signup: async (data: {
    email?: string
    phone?: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    // Call the API endpoint to create user in database
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Signup failed')
    }

    const result = await response.json()
    const user = result.user

    // Also save to localStorage for client-side access
    userStorage.setCurrentUser(user)
    
    // Trigger custom event for same-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'))
      // Also trigger storage event for multi-tab sync
      window.dispatchEvent(new Event('storage'))
    }
    
    return { user }
  },

  logout: async () => {
    // Call API to logout
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
    
    // Clear localStorage
    const currentUser = userStorage.getCurrentUser()
    if (currentUser) {
      profileStorage.setCurrentProfile(null, currentUser.id)
    }
    userStorage.setCurrentUser(null)
    
    // Trigger custom event for same-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-change'))
      window.dispatchEvent(new Event('profile-change'))
      window.dispatchEvent(new Event('storage'))
    }
  },

  updateProfile: (updates: any) => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const updated = userStorage.updateUser(user.id, {
      profile: {
        ...user.profile,
        ...updates,
      },
    })
    
    if (updated) {
      userStorage.setCurrentUser(updated)
      
      // Trigger custom event for same-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
        // Also trigger storage event for multi-tab sync
        window.dispatchEvent(new Event('storage'))
      }
    }
    
    return updated
  },
}

// Helper function for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  }
}

// Debounced watch history updates to prevent excessive API calls
let watchHistoryUpdateTimeout: NodeJS.Timeout | null = null
let pendingWatchHistoryUpdate: {
  movieId?: string
  seriesId?: string
  episodeId?: string
  progress: number
  currentTime: number
  duration: number
  completed?: boolean
} | null = null

// Watch history service
export const watchHistoryService = {
  getAll: async () => {
    try {
      const response = await fetchWithTimeout('/api/watch/history', {
        credentials: 'include',
      }, 30000)
      if (response.ok) {
        const data = await response.json()
        const apiHistory = data.history || data || []
        if (Array.isArray(apiHistory) && apiHistory.length > 0) {
          console.log('Watch history from API:', apiHistory.length, 'items')
          return apiHistory
        }
      }
    } catch (error) {
      console.warn('Failed to fetch watch history from API, using localStorage:', error)
    }
    
    // Fallback to localStorage - PROFILE-SPECIFIC
    const user = userStorage.getCurrentUser()
    if (!user) {
      console.warn('No user found, cannot get watch history')
      return []
    }
    
    // Get current profile - REQUIRED for profile-specific history
    const currentProfile = profileStorage.getCurrentProfile(user.id)
    if (!currentProfile) {
      console.warn('No profile selected, cannot get watch history')
      return []
    }
    
    console.log('Getting watch history for profile:', currentProfile.id, 'user:', user.id)
    
    // Get ONLY current profile's history from localStorage
    const allHistoryFromStorage = watchHistoryStorage.getAll()
    const history = allHistoryFromStorage.filter(h => 
      h.userId === user.id && h.profileId === currentProfile.id
    )
    
    console.log('Profile-specific history:', history.length, 'items')
    
    // Enrich with movie/series data from API
    const enriched = await Promise.all(history.map(async (h) => {
      let movie = null
      let series = null
      
      // Fetch from API if not already included
      if (h.movieId && !(h as any).movie) {
        try {
          const res = await fetch(`/api/content/movie/${h.movieId}`)
          if (res.ok) {
            const movieData = await res.json()
            movie = {
              id: movieData.id,
              title: movieData.title,
              posterUrl: movieData.posterUrl,
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      if (h.seriesId && !(h as any).series) {
        try {
          const res = await fetch(`/api/content/series/${h.seriesId}`)
          if (res.ok) {
            const seriesData = await res.json()
            series = {
              id: seriesData.id,
              title: seriesData.title,
              posterUrl: seriesData.posterUrl,
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      const result = {
        ...h,
        movie: (h as any).movie || movie || (h.movieId ? {
          id: h.movieId,
          title: 'Movie',
          posterUrl: '',
        } : null),
        series: (h as any).series || series || (h.seriesId ? {
          id: h.seriesId,
          title: 'Series',
          posterUrl: '',
        } : null),
      }
      
      return result
    }))
    
    // Don't filter out items - show all history even if movie/series data not found
    console.log('Enriched history:', enriched.length, 'items')
    return enriched
  },

  add: async (data: {
    movieId?: string
    seriesId?: string
    episodeId?: string
    progress: number
    currentTime: number
    duration: number
    completed?: boolean
  }, skipDebounce = false) => {
    // Save immediately if progress is 0 (watch start) or completed, otherwise debounce
    const isWatchStart = data.progress === 0 && data.currentTime === 0
    
    console.log('[WatchHistory] Adding:', {
      movieId: data.movieId,
      seriesId: data.seriesId,
      episodeId: data.episodeId,
      progress: data.progress.toFixed(1) + '%',
      currentTime: data.currentTime.toFixed(1) + 's',
      duration: data.duration.toFixed(1) + 's',
      completed: data.completed,
      isWatchStart,
      skipDebounce
    })
    
    // If skipDebounce is true (from debounced timeout), save immediately
    if (skipDebounce) {
      // Continue to save logic below
    } else if (data.completed || isWatchStart) {
      // Clear any pending update and save immediately
      if (watchHistoryUpdateTimeout) {
        clearTimeout(watchHistoryUpdateTimeout)
        watchHistoryUpdateTimeout = null
      }
      if (pendingWatchHistoryUpdate) {
        // Save pending update first, then save current
        const pending = pendingWatchHistoryUpdate
        pendingWatchHistoryUpdate = null
        await watchHistoryService.add(pending, true) // Skip debounce for pending
      }
    } else {
      // Debounce non-completed updates (but not watch start)
      // Save more frequently (every 2 seconds) to ensure progress is captured
      pendingWatchHistoryUpdate = data
      if (watchHistoryUpdateTimeout) {
        return // Already have a pending update, will be saved by existing timeout
      }
      watchHistoryUpdateTimeout = setTimeout(async () => {
        if (pendingWatchHistoryUpdate) {
          const updateData = pendingWatchHistoryUpdate
          pendingWatchHistoryUpdate = null
          watchHistoryUpdateTimeout = null
          console.log('[WatchHistory] Saving debounced update:', {
            progress: updateData.progress.toFixed(1) + '%',
            currentTime: updateData.currentTime.toFixed(1) + 's'
          })
          try {
            // Call add with skipDebounce=true to bypass debounce and save immediately
            const result = await watchHistoryService.add(updateData, true)
            console.log('[WatchHistory] Debounced update saved:', result ? 'success' : 'failed')
          } catch (error) {
            console.error('[WatchHistory] Failed to save debounced update:', error)
          }
        }
      }, 2000) // Wait 2 seconds before saving (reduced from 5 seconds)
      return // Return early for debounced updates
    }
    
    try {
      const response = await fetchWithTimeout('/api/watch/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      }, 30000)
      if (response.ok) {
        const result = await response.json()
        return result
      } else {
        const error = await response.json()
        // If content doesn't exist in DB, fall back to localStorage for mock data
        if (response.status === 404) {
          console.warn('Content not found in database, using localStorage fallback:', error.message)
          // Fall through to localStorage fallback
        } else {
          // Other errors - still try localStorage as fallback
          console.warn('API error, falling back to localStorage:', error.message)
        }
      }
    } catch (error) {
      console.error('Failed to add watch history via API:', error)
      // Fall through to localStorage fallback
    }
    
    // Fallback to localStorage - PROFILE-SPECIFIC
    console.log('[WatchHistory] Attempting localStorage save...')
    const user = userStorage.getCurrentUser()
    if (!user) {
      console.warn('❌ Not authenticated, cannot save watch history')
      return null
    }
    
    // Get current profile - REQUIRED for profile-specific history
    const currentProfile = profileStorage.getCurrentProfile(user.id)
    if (!currentProfile) {
      console.warn('❌ No profile selected, cannot save watch history')
      return null
    }
    
    const profileId = currentProfile.id
    console.log('[WatchHistory] Using profileId:', profileId)
    
    try {
      console.log('[WatchHistory] Calling watchHistoryStorage.upsert with:', {
        userId: user.id,
        profileId: profileId,
        movieId: data.movieId,
        progress: data.progress,
        currentTime: data.currentTime
      })
      const saved = watchHistoryStorage.upsert({
        userId: user.id,
        profileId: profileId,
        ...data,
        completed: data.completed || false,
      })
      console.log('✅ Watch history saved to localStorage:', {
        id: saved.id,
        movieId: saved.movieId,
        seriesId: saved.seriesId,
        episodeId: saved.episodeId,
        progress: saved.progress,
        currentTime: saved.currentTime,
        duration: saved.duration,
        userId: saved.userId,
        profileId: saved.profileId,
        completed: saved.completed
      })
      
      // Verify it was saved by reading it back
      const verify = watchHistoryStorage.getByUser(user.id)
      console.log('✅ Verification - history items for user:', verify.length)
      if (verify.length > 0) {
        const movieHistory = verify.find(h => h.movieId === data.movieId)
        if (movieHistory) {
          console.log('✅ Found saved item:', {
            id: movieHistory.id,
            progress: movieHistory.progress,
            currentTime: movieHistory.currentTime,
            profileId: movieHistory.profileId
          })
        } else {
          console.warn('⚠️ Saved item not found in verification!')
        }
      }
      
      return saved
    } catch (error) {
      console.error('❌ Failed to save watch history to localStorage:', error)
      return null
    }
  },

  delete: async (movieId?: string, seriesId?: string, episodeId?: string) => {
    try {
      const response = await fetchWithTimeout('/api/watch/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieId, seriesId, episodeId }),
      }, 30000)
      if (response.ok) {
        return
      }
    } catch (error) {
      console.error('Failed to delete watch history via API:', error)
    }
    
    // Fallback to localStorage - PROFILE-SPECIFIC
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const currentProfile = profileStorage.getCurrentProfile(user.id)
    if (!currentProfile) throw new Error('No profile selected')
    
    // Delete only from current profile's history
    watchHistoryStorage.delete(user.id, movieId, seriesId, episodeId)
  },

  clear: async () => {
    // API doesn't have clear all, so delete individually or use localStorage
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const currentProfile = profileStorage.getCurrentProfile(user.id)
    if (!currentProfile) throw new Error('No profile selected')
    
    // Clear only current profile's history
    const allHistory = watchHistoryStorage.getAll()
    const filtered = allHistory.filter(h => 
      !(h.userId === user.id && h.profileId === currentProfile.id)
    )
    localStorage.setItem('nepverse_watch_history', JSON.stringify(filtered))
  },
}

// Watch list service
export const watchListService = {
  getAll: async () => {
    const user = userStorage.getCurrentUser()
    if (!user) {
      console.log('[WatchList] No user found')
      return []
    }
    
    // Get current profile - REQUIRED for profile-specific watchlist
    const currentProfile = profileStorage.getCurrentProfile(user.id)
    if (!currentProfile) {
      console.log('[WatchList] No profile selected - cannot get watchlist')
      return []
    }

    console.log('[WatchList] Getting list for profile:', currentProfile.id, 'user:', user.id)

    // Get from API (database)
    let apiList: any[] = []
    try {
      const response = await fetchWithTimeout('/api/watch/list', {
        credentials: 'include',
      }, 30000)
      if (response.ok) {
        const data = await response.json()
        // Handle paginated response
        apiList = Array.isArray(data) ? data : (data.watchList || [])
        console.log('[WatchList] API returned:', apiList.length, 'items')
      } else {
        console.log('[WatchList] API error:', response.status)
      }
    } catch (error) {
      console.error('[WatchList] Failed to fetch watch list from API:', error)
    }
    
    // Get from localStorage (for mock data that doesn't exist in DB)
    const allLocalList = watchListStorage.getAll()
    console.log('[WatchList] All localStorage items:', allLocalList.length)
    console.log('[WatchList] All localStorage items data:', allLocalList)
    
    // Get ONLY current profile's watchlist
    let localList = watchListStorage.getByProfile(currentProfile.id)
    console.log('[WatchList] localStorage items for profile ID:', currentProfile.id, 'count:', localList.length)
    
    // Ensure all items belong to current profile
    localList = localList.filter(item => 
      item.userId === user.id && item.profileId === currentProfile.id
    )
    console.log('[WatchList] Filtered to current profile only:', localList.length)
    
    // Merge both sources, prioritizing API (database) items
    // Create a map to avoid duplicates
    const mergedMap = new Map<string, any>()
    
    // First add localStorage items (fetch from API if needed)
    for (const item of localList) {
      const key = item.movieId || item.seriesId || ''
      if (key) {
        let movie = (item as any).movie || null
        let series = (item as any).series || null
        
        // Fetch from API if not already included
        if (item.movieId && !movie) {
          try {
            const res = await fetch(`/api/content/movie/${item.movieId}`)
            if (res.ok) {
              const movieData = await res.json()
              movie = {
                id: movieData.id,
                title: movieData.title,
                posterUrl: movieData.posterUrl,
                rating: movieData.rating,
                year: new Date(movieData.releaseDate).getFullYear(),
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        if (item.seriesId && !series) {
          try {
            const res = await fetch(`/api/content/series/${item.seriesId}`)
            if (res.ok) {
              const seriesData = await res.json()
              series = {
                id: seriesData.id,
                title: seriesData.title,
                posterUrl: seriesData.posterUrl,
                rating: seriesData.rating,
                year: new Date(seriesData.releaseDate).getFullYear(),
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        mergedMap.set(key, {
          ...item,
          movie,
          series,
        })
      }
    }
    
    // Then add API items (overwrite if exists, since DB is source of truth)
    apiList.forEach(item => {
      const key = item.movieId || item.seriesId || ''
      if (key) {
        mergedMap.set(key, item)
      }
    })
    
    const result = Array.from(mergedMap.values())
    console.log('[WatchList] Final merged result:', result.length, 'items')
    return result
  },

  add: async (movieId?: string, seriesId?: string) => {
    if (!movieId && !seriesId) {
      throw new Error('movieId or seriesId is required')
    }

    try {
      const response = await fetchWithTimeout('/api/watch/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieId, seriesId }),
      }, 30000)

      if (response.ok) {
        const result = await response.json()
        return result
      } else {
        const error = await response.json()
        // If content doesn't exist in DB, fall back to localStorage for mock data
        if (response.status === 404) {
          console.warn('Content not found in database, using localStorage fallback:', error.message)
          // Fall through to localStorage fallback
        } else {
          throw new Error(error.message || 'Failed to add to watchlist')
        }
      }
    } catch (error: any) {
      console.error('Failed to add to watchlist via API:', error)
      // Fallback to localStorage
      const user = userStorage.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      
      const currentProfile = profileStorage.getCurrentProfile(user.id)
      if (!currentProfile) throw new Error('No profile selected')
      
      return watchListStorage.add({
        userId: user.id,
        profileId: currentProfile.id,
        movieId: movieId || undefined,
        seriesId: seriesId || undefined,
      })
    }
  },

  remove: async (movieId?: string, seriesId?: string) => {
    if (!movieId && !seriesId) {
      throw new Error('movieId or seriesId is required')
    }

    try {
      const response = await fetchWithTimeout('/api/watch/list', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ movieId, seriesId }),
      }, 30000)

      if (response.ok) {
        return
      } else {
        const error = await response.json()
        // If content doesn't exist in DB, fall back to localStorage for mock data
        if (response.status === 404) {
          console.warn('Content not found in database, using localStorage fallback:', error.message)
          // Fall through to localStorage fallback
        } else {
          throw new Error(error.message || 'Failed to remove from watchlist')
        }
      }
    } catch (error: any) {
      console.error('Failed to remove from watchlist via API:', error)
      // Fallback to localStorage - PROFILE-SPECIFIC
      const user = userStorage.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      
      // Get current profile - REQUIRED
      const currentProfile = profileStorage.getCurrentProfile(user.id)
      if (!currentProfile) throw new Error('No profile selected')
      
      // Remove only from current profile's watchlist
      watchListStorage.remove(user.id, movieId, seriesId)
    }
  },
}

// Reviews service
export const reviewsService = {
  getByContent: (contentId: string, contentType: 'movie' | 'series') => {
    return reviewsStorage.getByContent(contentId, contentType)
  },

  add: (contentId: string, contentType: 'movie' | 'series', rating: number, comment: string) => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    
    if (!comment || comment.trim().length < 10) {
      throw new Error('Comment must be at least 10 characters')
    }
    
    const userName = user.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
      : user.email || 'Anonymous'
    
    return reviewsStorage.add({
      userId: user.id,
      userName,
      contentId,
      contentType,
      rating,
      comment: comment.trim(),
    })
  },

  markHelpful: (reviewId: string, helpful: boolean) => {
    reviewsStorage.markHelpful(reviewId, helpful)
  },
}

// Account service
export const accountService = {
  updateAccount: (data: {
    email?: string
    phone?: string
    currentPassword?: string
    newPassword?: string
  }) => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    // If changing password, verify current password
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error('Current password is required')
      }
      if (user.passwordHash !== data.currentPassword) {
        throw new Error('Incorrect current password')
      }
    }
    
    const updated = userStorage.updateUser(user.id, {
      email: data.email !== undefined ? data.email : user.email,
      phone: data.phone !== undefined ? data.phone : user.phone,
      passwordHash: data.newPassword || user.passwordHash,
    })
    
    if (updated) {
      userStorage.setCurrentUser(updated)
    }
    
    return updated
  },
}

// Preferences service
export const preferencesService = {
  getPreferences: () => {
    const user = userStorage.getCurrentUser()
    if (!user) return null
    
    return (user.profile as any)?.preferences || {
      autoplay: true,
      autoplayNext: true,
      defaultQuality: 'auto',
      defaultSubtitle: 'off',
    }
  },

  updatePreferences: (preferences: any) => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const updated = userStorage.updateUser(user.id, {
      profile: {
        ...user.profile,
        preferences: preferences as any,
      } as any,
    })
    
    if (updated) {
      userStorage.setCurrentUser(updated)
    }
    
    return updated
  },
}

// Notifications service
export const notificationsStorage = {
  getAll: (): any[] => {
    if (typeof window === 'undefined') return []
    const { userStorage } = require('./localStorage')
    userStorage.init()
    return JSON.parse(localStorage.getItem('nepverse_notifications') || '[]')
  },

  getByUser: (userId: string): any[] => {
    return notificationsStorage.getAll().filter(n => n.userId === userId)
  },

  add: (notification: any) => {
    if (typeof window === 'undefined') return
    const all = notificationsStorage.getAll()
    const newNotification = {
      ...notification,
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
    }
    all.push(newNotification)
    localStorage.setItem('nepverse_notifications', JSON.stringify(all))
    return newNotification
  },

  markAsRead: (id: string) => {
    if (typeof window === 'undefined') return
    const all = notificationsStorage.getAll()
    const index = all.findIndex(n => n.id === id)
    if (index >= 0) {
      all[index].read = true
      localStorage.setItem('nepverse_notifications', JSON.stringify(all))
    }
  },

  markAllAsRead: (userId: string) => {
    if (typeof window === 'undefined') return
    const all = notificationsStorage.getAll()
    all.forEach(n => {
      if (n.userId === userId) {
        n.read = true
      }
    })
    localStorage.setItem('nepverse_notifications', JSON.stringify(all))
  },
}

// Initialize with welcome notification for new users
if (typeof window !== 'undefined') {
  const { userStorage } = require('./localStorage')
  userStorage.init()
  
  // Add welcome notification for new users
  const user = userStorage.getCurrentUser()
  if (user) {
    const existing = notificationsStorage.getByUser(user.id)
    if (existing.length === 0) {
      notificationsStorage.add({
        userId: user.id,
        title: 'Welcome to NepVerse!',
        message: 'Start your free trial and explore unlimited Nepali content.',
        type: 'info',
      })
    }
  }
}

// Subscription service
export const subscriptionService = {
  getCurrent: () => {
    const user = userStorage.getCurrentUser()
    if (!user) return null
    
    return subscriptionStorage.getByUser(user.id)
  },

  create: (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1))
    
    const subscription = subscriptionStorage.create({
      userId: user.id,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    })
    
    // Update user
    userStorage.updateUser(user.id, { subscription })
    
    return subscription
  },

  cancel: () => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const subscription = subscriptionStorage.getByUser(user.id)
    if (!subscription) {
      throw new Error('No active subscription')
    }
    
    const updated = subscriptionStorage.update(subscription.id, {
      cancelAtPeriodEnd: true,
    })
    
    if (updated) {
      userStorage.updateUser(user.id, { subscription: updated })
    }
    
    return updated
  },

  resume: () => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const subscription = subscriptionStorage.getByUser(user.id)
    if (!subscription) {
      throw new Error('No subscription to resume')
    }
    
    const updated = subscriptionStorage.update(subscription.id, {
      cancelAtPeriodEnd: false,
    })
    
    if (updated) {
      userStorage.updateUser(user.id, { subscription: updated })
    }
    
    return updated
  },

  changePlan: (newPlanId: string, billingCycle: 'monthly' | 'yearly') => {
    const user = userStorage.getCurrentUser()
    if (!user) throw new Error('Not authenticated')
    
    const subscription = subscriptionStorage.getByUser(user.id)
    if (!subscription) {
      throw new Error('No active subscription')
    }
    
    // Update the plan
    const updated = subscriptionStorage.update(subscription.id, {
      planId: newPlanId,
      // Keep the same billing period dates, just change the plan
    })
    
    if (updated) {
      userStorage.updateUser(user.id, { subscription: updated })
    }
    
    return updated
  },
}

