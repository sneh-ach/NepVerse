// LocalStorage service for demo/presentation purposes
// This allows the full flow to work without a database
// NOTE: localStorage operations only work on client (browser)

export interface UserProfile {
  id: string
  userId: string
  name: string
  avatar: string // URL or base64
  avatarType: 'default' | 'uploaded' // Whether it's a default avatar or uploaded
  pin?: string // 4-digit PIN (hashed)
  isKidsProfile: boolean
  createdAt: string
  updatedAt: string
}

export interface LocalUser {
  id: string
  email?: string
  phone?: string
  passwordHash: string
  profiles?: UserProfile[] // Multiple profiles per user
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
    country?: string
    language?: string
  }
  subscription?: {
    id: string
    planId: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }
  createdAt: string
}

export interface LocalWatchHistory {
  id: string
  userId: string
  profileId: string // Profile-specific history
  movieId?: string
  seriesId?: string
  episodeId?: string
  progress: number
  currentTime: number
  duration: number
  completed: boolean
  lastWatchedAt: string
}

export interface LocalWatchList {
  id: string
  userId: string
  profileId: string // Profile-specific watchlist
  movieId?: string
  seriesId?: string
  createdAt: string
}

export interface LocalReview {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  contentId: string
  contentType: 'movie' | 'series'
  rating: number
  comment: string
  helpful: number
  createdAt: string
}

const STORAGE_KEYS = {
  USERS: 'nepverse_users',
  CURRENT_USER: 'nepverse_current_user',
  CURRENT_PROFILE: 'nepverse_current_profile',
  PROFILES: 'nepverse_profiles',
  WATCH_HISTORY: 'nepverse_watch_history',
  WATCH_LIST: 'nepverse_watch_list',
  REVIEWS: 'nepverse_reviews',
  SUBSCRIPTIONS: 'nepverse_subscriptions',
  NOTIFICATIONS: 'nepverse_notifications',
}

// Initialize storage with empty arrays if needed
function initStorage() {
  if (typeof window === 'undefined') return

  try {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.WATCH_LIST)) {
      localStorage.setItem(STORAGE_KEYS.WATCH_LIST, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([]))
    }
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('localStorage quota exceeded. Clearing old data...')
      // Clear oldest data if quota exceeded
      try {
        localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY)
        localStorage.removeItem(STORAGE_KEYS.REVIEWS)
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError)
      }
    } else {
      console.error('localStorage error:', error)
    }
  }
}

// Profile operations
export const profileStorage = {
  getAll: (): UserProfile[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]')
  },

  getByUser: (userId: string): UserProfile[] => {
    return profileStorage.getAll().filter(p => p.userId === userId)
  },

  getById: (profileId: string): UserProfile | null => {
    const profiles = profileStorage.getAll()
    return profiles.find(p => p.id === profileId) || null
  },

  getCurrentProfile: (userId?: string): UserProfile | null => {
    if (typeof window === 'undefined') return null
    initStorage()
    
    // If userId provided, get profile for that specific user
    if (userId) {
      const key = `${STORAGE_KEYS.CURRENT_PROFILE}_${userId}`
      const profileStr = localStorage.getItem(key)
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr)
          // Verify the profile still exists and belongs to this user
          const existingProfile = profileStorage.getById(profile.id)
          if (existingProfile && existingProfile.userId === userId) {
            return existingProfile
          }
          // If profile doesn't exist in list but we have it stored, return it anyway
          // (might be a newly created profile that hasn't been synced yet)
          if (profile.userId === userId) {
            return profile
          }
        } catch (e) {
          // Invalid JSON, clear it
          localStorage.removeItem(key)
        }
      }
      return null
    }
    
    // Fallback to global current profile (for backward compatibility)
    const profileStr = localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE)
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        // Verify the profile still exists
        const existingProfile = profileStorage.getById(profile.id)
        if (existingProfile) {
          return existingProfile
        }
        // If profile doesn't exist in list but we have it stored, return it anyway
        return profile
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROFILE)
      }
    }
    return null
  },

  setCurrentProfile: (profile: UserProfile | null, userId?: string) => {
    if (typeof window === 'undefined') return
    
    // If userId provided, store profile per user
    if (userId && profile) {
      const key = `${STORAGE_KEYS.CURRENT_PROFILE}_${userId}`
      localStorage.setItem(key, JSON.stringify(profile))
      // Also set global for backward compatibility
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, JSON.stringify(profile))
    } else if (profile) {
      // Set global current profile
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, JSON.stringify(profile))
      // If we have a userId from the profile, also store it per user
      if (profile.userId) {
        const key = `${STORAGE_KEYS.CURRENT_PROFILE}_${profile.userId}`
        localStorage.setItem(key, JSON.stringify(profile))
      }
    } else {
      // Clear both global and user-specific
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROFILE)
      if (userId) {
        const key = `${STORAGE_KEYS.CURRENT_PROFILE}_${userId}`
        localStorage.removeItem(key)
      }
    }
    
    // Trigger event for sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-change'))
    }
  },

  create: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): UserProfile => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const allProfiles = profileStorage.getAll()
    
    // Check max profiles (5 per user)
    const userProfiles = profileStorage.getByUser(profile.userId)
    if (userProfiles.length >= 5) {
      throw new Error('Maximum 5 profiles allowed per account')
    }

    const newProfile: UserProfile = {
      ...profile,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    allProfiles.push(newProfile)
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(allProfiles))
    return newProfile
  },

  update: (profileId: string, updates: Partial<UserProfile>): UserProfile | null => {
    if (typeof window === 'undefined') return null
    initStorage()
    const allProfiles = profileStorage.getAll()
    const index = allProfiles.findIndex(p => p.id === profileId)
    if (index === -1) return null

    allProfiles[index] = {
      ...allProfiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(allProfiles))
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        throw new Error('Storage quota exceeded. Please clear some data.')
      }
      throw error
    }

    // Update current profile if it's the same
    const currentProfile = profileStorage.getCurrentProfile()
    if (currentProfile?.id === profileId) {
      profileStorage.setCurrentProfile(allProfiles[index])
    }

    return allProfiles[index]
  },

  delete: (profileId: string) => {
    if (typeof window === 'undefined') return
    initStorage()
    const allProfiles = profileStorage.getAll()
    const filtered = allProfiles.filter(p => p.id !== profileId)
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(filtered))

    // Clear current profile if deleted
    const currentProfile = profileStorage.getCurrentProfile()
    if (currentProfile?.id === profileId) {
      profileStorage.setCurrentProfile(null)
    }

    // Delete associated watch history and watchlist
    const allHistory = watchHistoryStorage.getAll()
    const filteredHistory = allHistory.filter(h => h.profileId !== profileId)
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(filteredHistory))

    const allList = watchListStorage.getAll()
    const filteredList = allList.filter(w => w.profileId !== profileId)
    localStorage.setItem(STORAGE_KEYS.WATCH_LIST, JSON.stringify(filteredList))
  },

  verifyPin: async (profileId: string, pin: string): Promise<boolean> => {
    const profile = profileStorage.getById(profileId)
    if (!profile || !profile.pin) return true // No PIN set, allow access
    
    // Try API verification first (uses proper bcrypt comparison)
    try {
      const response = await fetch(`/api/profiles/${profileId}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.valid === true
      }
    } catch (error) {
      console.error('PIN verification API error:', error)
    }
    
    // Fallback: If PIN in localStorage is hashed, we can't compare directly
    // For now, return false to force API verification
    return false
  },
}

// User operations
export const userStorage = {
  init: initStorage,

  getCurrentUser: (): LocalUser | null => {
    if (typeof window === 'undefined') return null
    initStorage()
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userStr ? JSON.parse(userStr) : null
  },

  setCurrentUser: (user: LocalUser | null) => {
    if (typeof window === 'undefined') return
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  },

  getAllUsers: (): LocalUser[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
  },

  createUser: (user: Omit<LocalUser, 'id' | 'createdAt'>): LocalUser => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const users = userStorage.getAllUsers()
    const newUser: LocalUser = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    return newUser
  },

  findUserByEmail: (email: string): LocalUser | null => {
    const users = userStorage.getAllUsers()
    return users.find(u => u.email === email) || null
  },

  findUserByPhone: (phone: string): LocalUser | null => {
    const users = userStorage.getAllUsers()
    return users.find(u => u.phone === phone) || null
  },

  updateUser: (userId: string, updates: Partial<LocalUser>): LocalUser | null => {
    if (typeof window === 'undefined') return null
    initStorage()
    const users = userStorage.getAllUsers()
    const index = users.findIndex(u => u.id === userId)
    if (index === -1) return null

    users[index] = { ...users[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

    // Update current user if it's the same user
    const currentUser = userStorage.getCurrentUser()
    if (currentUser?.id === userId) {
      userStorage.setCurrentUser(users[index])
    }

    return users[index]
  },
}

// Watch History operations
export const watchHistoryStorage = {
  getAll: (): LocalWatchHistory[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY) || '[]')
  },

  getByUser: (userId: string): LocalWatchHistory[] => {
    return watchHistoryStorage.getAll().filter(h => h.userId === userId)
  },

  getByProfile: (profileId: string): LocalWatchHistory[] => {
    return watchHistoryStorage.getAll().filter(h => h.profileId === profileId)
  },

  upsert: (history: Omit<LocalWatchHistory, 'id' | 'lastWatchedAt'>): LocalWatchHistory => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const allHistory = watchHistoryStorage.getAll()
    
    // Find existing entry - match by userId, profileId, and content (movieId or seriesId+episodeId)
    const existingIndex = allHistory.findIndex(h => 
      h.userId === history.userId &&
      h.profileId === history.profileId &&
      ((history.movieId && h.movieId === history.movieId) ||
       (history.seriesId && h.seriesId === history.seriesId && h.episodeId === history.episodeId))
    )

    const newHistory: LocalWatchHistory = {
      ...history,
      id: existingIndex >= 0 ? allHistory[existingIndex].id : `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastWatchedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      console.log('[localStorage] Updating existing history entry:', {
        id: newHistory.id,
        oldProgress: allHistory[existingIndex].progress,
        newProgress: newHistory.progress,
        oldCurrentTime: allHistory[existingIndex].currentTime,
        newCurrentTime: newHistory.currentTime
      })
      allHistory[existingIndex] = newHistory
    } else {
      console.log('[localStorage] Creating new history entry:', {
        id: newHistory.id,
        progress: newHistory.progress,
        currentTime: newHistory.currentTime
      })
      allHistory.push(newHistory)
    }

    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(allHistory))
    
    // Verify it was saved
    const verify = JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY) || '[]')
    const saved = verify.find((h: LocalWatchHistory) => h.id === newHistory.id)
    if (saved) {
      console.log('[localStorage] Verified save:', {
        id: saved.id,
        progress: saved.progress,
        currentTime: saved.currentTime
      })
    } else {
      console.error('[localStorage] ❌ Save verification failed - item not found after save!')
    }
    
    return newHistory
  },

  delete: (userId: string, movieId?: string, seriesId?: string, episodeId?: string) => {
    if (typeof window === 'undefined') return
    initStorage()
    const allHistory = watchHistoryStorage.getAll()
    const filtered = allHistory.filter(h => 
      !(h.userId === userId &&
        (movieId ? h.movieId === movieId :
         seriesId ? h.seriesId === seriesId && h.episodeId === episodeId : false))
    )
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(filtered))
  },

  deleteAll: (userId: string) => {
    if (typeof window === 'undefined') return
    initStorage()
    const allHistory = watchHistoryStorage.getAll()
    const filtered = allHistory.filter(h => h.userId !== userId)
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(filtered))
  },
}

// Watch List operations
export const watchListStorage = {
  getAll: (): LocalWatchList[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_LIST) || '[]')
  },

  getByUser: (userId: string): LocalWatchList[] => {
    return watchListStorage.getAll().filter(w => w.userId === userId)
  },

  getByProfile: (profileId: string): LocalWatchList[] => {
    return watchListStorage.getAll().filter(w => w.profileId === profileId)
  },

  add: (item: Omit<LocalWatchList, 'id' | 'createdAt'>): LocalWatchList => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const allList = watchListStorage.getAll()

    // Check if already exists (by profileId now)
    const exists = allList.some(w =>
      w.profileId === item.profileId &&
      ((item.movieId && w.movieId === item.movieId) ||
       (item.seriesId && w.seriesId === item.seriesId))
    )

    if (exists) {
      throw new Error('Already in watchlist')
    }

    const newItem: LocalWatchList = {
      ...item,
      id: `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    allList.push(newItem)
    localStorage.setItem(STORAGE_KEYS.WATCH_LIST, JSON.stringify(allList))
    return newItem
  },

  remove: (userId: string, movieId?: string, seriesId?: string) => {
    if (typeof window === 'undefined') return
    initStorage()
    const allList = watchListStorage.getAll()
    // Get current profile to filter by profileId - REQUIRED
    const currentProfile = profileStorage.getCurrentProfile(userId)
    if (!currentProfile) {
      console.warn('No profile selected, cannot remove from watchlist')
      return
    }
    // Remove only from current profile's watchlist
    const filtered = allList.filter(w =>
      !(w.userId === userId && 
        w.profileId === currentProfile.id &&
        (movieId ? w.movieId === movieId : w.seriesId === seriesId))
    )
    localStorage.setItem(STORAGE_KEYS.WATCH_LIST, JSON.stringify(filtered))
  },
}

// Reviews operations
export const reviewsStorage = {
  getAll: (): LocalReview[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || '[]')
  },

  getByContent: (contentId: string, contentType: 'movie' | 'series'): LocalReview[] => {
    return reviewsStorage.getAll().filter(r =>
      r.contentId === contentId && r.contentType === contentType
    )
  },

  add: (review: Omit<LocalReview, 'id' | 'createdAt' | 'helpful'>): LocalReview => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const allReviews = reviewsStorage.getAll()
    const currentUser = userStorage.getCurrentUser()

    const newReview: LocalReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      helpful: 0,
      createdAt: new Date().toISOString(),
      userName: currentUser?.profile?.firstName
        ? `${currentUser.profile.firstName} ${currentUser.profile.lastName || ''}`.trim()
        : currentUser?.email || 'Anonymous',
    }

    allReviews.push(newReview)
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(allReviews))
    return newReview
  },

  markHelpful: (reviewId: string, helpful: boolean) => {
    if (typeof window === 'undefined') return
    initStorage()
    const allReviews = reviewsStorage.getAll()
    const index = allReviews.findIndex(r => r.id === reviewId)
    if (index >= 0) {
      if (helpful) {
        allReviews[index].helpful = (allReviews[index].helpful || 0) + 1
      }
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(allReviews))
    }
  },
}

// Subscription operations
export const subscriptionStorage = {
  getAll: (): any[] => {
    if (typeof window === 'undefined') return []
    initStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS) || '[]')
  },

  getByUser: (userId: string): any | null => {
    const all = subscriptionStorage.getAll()
    return all.find(s => s.userId === userId && (s.status === 'ACTIVE' || s.status === 'TRIALING')) || null
  },

  create: (subscription: any): any => {
    if (typeof window === 'undefined') throw new Error('localStorage not available')
    initStorage()
    const all = subscriptionStorage.getAll()
    const newSub = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    all.push(newSub)
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(all))
    
    // Update user's subscription
    const user = userStorage.getCurrentUser()
    if (user) {
      userStorage.updateUser(user.id, { subscription: newSub })
    }
    
    return newSub
  },

  update: (subscriptionId: string, updates: any): any | null => {
    if (typeof window === 'undefined') return null
    initStorage()
    const all = subscriptionStorage.getAll()
    const index = all.findIndex(s => s.id === subscriptionId)
    if (index >= 0) {
      all[index] = { ...all[index], ...updates }
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(all))
      
      // Update user's subscription
      const user = userStorage.getCurrentUser()
      if (user && user.subscription?.id === subscriptionId) {
        userStorage.updateUser(user.id, { subscription: all[index] })
      }
      
      return all[index]
    }
    return null
  },
}

