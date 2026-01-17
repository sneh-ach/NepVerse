'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { profileStorage, UserProfile } from '@/lib/localStorage'
import { Button } from '@/components/ui/Button'
import { Plus, Edit, Trash2, Lock, X } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'

// Force dynamic rendering - this page uses useSearchParams
export const dynamic = 'force-dynamic'

const DEFAULT_AVATARS = [
  '👤', '👨', '👩', '👧', '👦', '🧑', '👴', '👵',
  '🎭', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝',
  '🤴', '👸', '🦸‍♀️', '🦸‍♂️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '👨‍🎤',
]

function ProfilesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null)
  const [deletePinInput, setDeletePinInput] = useState('')

  useEffect(() => {
    if (loading) return // Wait for auth to finish loading
    
    if (!user) {
      router.push('/login?redirect=/profiles')
      return
    }

    // Check if user already has a profile selected and no redirect is needed
    const redirect = searchParams.get('redirect')
    if (!redirect) {
      // No redirect means user navigated here directly - check if they have a profile
      const currentProfile = profileStorage.getCurrentProfile(user.id)
      if (currentProfile) {
        // User has a profile, they can stay on this page to manage profiles
        // Don't auto-redirect
      }
    }

    loadProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]) // Only depend on user.id, not the whole user object or router

  const loadProfiles = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/profiles', {
        credentials: 'include',
        cache: 'no-store', // Ensure fresh data
      })
      if (response.ok) {
        const data = await response.json()
        // API returns array directly, not wrapped in { profiles: [...] }
        const profilesList = Array.isArray(data) ? data : (data.profiles || [])
        // Force state update
        setProfiles([...profilesList])
        
        // Sync profiles to localStorage for consistency
        if (profilesList.length > 0) {
          profilesList.forEach((profile: UserProfile) => {
            try {
              const existing = profileStorage.getById(profile.id)
              if (!existing) {
                // Profile from API doesn't exist in localStorage, add it
                profileStorage.create({
                  userId: profile.userId || user.id,
                  name: profile.name,
                  avatar: profile.avatar,
                  avatarType: profile.avatarType || 'default',
                  pin: profile.pin,
                  isKidsProfile: profile.isKidsProfile || false,
                })
              }
            } catch (e) {
              // Ignore errors
            }
          })
        }
      } else {
        // Fallback to localStorage if API fails
        const userProfiles = profileStorage.getByUser(user.id)
        setProfiles([...userProfiles])
      }
    } catch (error) {
      console.error('Failed to load profiles from API:', error)
      // Fallback to localStorage
      const userProfiles = profileStorage.getByUser(user.id)
      setProfiles([...userProfiles])
    }
  }

  const handleSelectProfile = (profile: UserProfile) => {
    if (profile.pin) {
      // Show PIN input modal
      setSelectedProfile(profile)
      setShowPinModal(true)
      setPinInput('')
      return
    }

    // No PIN, proceed directly
    proceedWithProfile(profile)
  }

  const proceedWithProfile = async (profile: UserProfile) => {
    if (!user?.id) {
      toast.error('User not found')
      return
    }

    // CRITICAL: Set profile in localStorage FIRST (synchronously)
    // This must happen before any async operations
    profileStorage.setCurrentProfile(profile, user.id)
    
    // Verify it was set correctly (with retry)
    let verifyProfile = profileStorage.getCurrentProfile(user.id)
    if (!verifyProfile || verifyProfile.id !== profile.id) {
      // Retry once
      profileStorage.setCurrentProfile(profile, user.id)
      verifyProfile = profileStorage.getCurrentProfile(user.id)
      if (!verifyProfile || verifyProfile.id !== profile.id) {
        console.error('Failed to set profile in localStorage after retry')
        toast.error('Failed to set profile. Please try again.')
        return
      }
    }

    // Set flag to indicate we just selected a profile
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('justSelectedProfile', 'true')
      sessionStorage.setItem('selectedProfileId', profile.id)
      sessionStorage.setItem('profileSetAt', Date.now().toString())
    }

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('profile-change'))
    
    // Set current profile via API (async, but localStorage is already set)
    try {
      const response = await fetch('/api/profiles/current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ profileId: profile.id }),
      })
      if (!response.ok) {
        throw new Error('Failed to set current profile')
      }
    } catch (error) {
      console.error('Failed to set current profile via API:', error)
      // localStorage is already set, so we can continue
    }
    
    toast.success(`Welcome back, ${profile.name}!`, {
      duration: 2000,
    })
    
    // Redirect to original destination or homepage
    const redirect = searchParams.get('redirect')
    // Prevent redirect loops - don't redirect back to profiles page
    // Also check if redirect is valid and not empty
    if (redirect && redirect !== '/profiles' && !redirect.startsWith('/profiles?') && redirect !== '/profiles/') {
      // Use replace instead of push to avoid back button issues
      router.replace(redirect)
    } else {
      // Always redirect to home after selecting profile
      router.replace('/')
    }
  }

  const handlePinSubmit = async () => {
    if (!selectedProfile) return

    if (pinInput.length !== 4) {
      toast.error('Please enter a 4-digit PIN', {
        duration: 2500,
      })
      return
    }

    // Verify PIN via API
    try {
      const response = await fetch(`/api/profiles/${selectedProfile.id}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ pin: pinInput }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.valid) {
        toast.error(data.message || 'Incorrect PIN. Please try again.', {
          duration: 3000,
        })
        setPinInput('')
        // Refocus first input
        setTimeout(() => {
          const firstInput = document.getElementById('pin-0')
          firstInput?.focus()
        }, 100)
        return
      }

      // PIN verified, proceed
      setShowPinModal(false)
      await proceedWithProfile(selectedProfile)
      setPinInput('')
      setSelectedProfile(null)
    } catch (error) {
      console.error('PIN verification error:', error)
      toast.error('Failed to verify PIN. Please try again.', {
        duration: 3000,
      })
      setPinInput('')
      setTimeout(() => {
        const firstInput = document.getElementById('pin-0')
        firstInput?.focus()
      }, 100)
      return
    }
  }

  // Auto-verify when 4 digits are entered
  useEffect(() => {
    if (pinInput.length === 4 && selectedProfile && showPinModal) {
      // Small delay for better UX - let user see all 4 digits
      const timer = setTimeout(() => {
        handlePinSubmit()
      }, 300)
      return () => clearTimeout(timer)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [pinInput, selectedProfile, showPinModal])

  const handleDeleteProfile = (profile: UserProfile) => {
    setProfileToDelete(profile)
    setShowDeleteModal(true)
    setDeletePinInput('')
  }

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return

    // If profile has PIN, verify it first
    if (profileToDelete.pin) {
      if (deletePinInput.length !== 4) {
        toast.error('Please enter a 4-digit PIN', {
          duration: 2500,
        })
        return
      }

      // Verify PIN via API
      try {
        const response = await fetch(`/api/profiles/${profileToDelete.id}/verify-pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ pin: deletePinInput }),
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.valid) {
          toast.error(data.message || 'Incorrect PIN. Please try again.', {
            duration: 3000,
          })
          setDeletePinInput('')
          setTimeout(() => {
            const firstInput = document.getElementById('delete-pin-0')
            firstInput?.focus()
          }, 100)
          return
        }
      } catch (error) {
        console.error('PIN verification error:', error)
        toast.error('Failed to verify PIN. Please try again.', {
          duration: 3000,
        })
        setDeletePinInput('')
        return
      }
    }

    // PIN verified (or no PIN), proceed with deletion
    try {
      const response = await fetch(`/api/profiles/${profileToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (response.ok) {
        // If this was the current profile, clear it
        const currentProfile = profileStorage.getCurrentProfile(user?.id || '')
        if (currentProfile?.id === profileToDelete.id) {
          profileStorage.clearCurrentProfile(user?.id || '')
          window.dispatchEvent(new Event('profile-change'))
        }
        
        loadProfiles()
        setShowDeleteModal(false)
        setProfileToDelete(null)
        setDeletePinInput('')
        toast.success('Profile deleted successfully', {
          duration: 3000,
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete profile')
      }
    } catch (error: any) {
      console.error('Failed to delete profile via API:', error)
      // Fallback to localStorage
      profileStorage.delete(profileToDelete.id)
      const currentProfile = profileStorage.getCurrentProfile(user?.id || '')
      if (currentProfile?.id === profileToDelete.id) {
        profileStorage.clearCurrentProfile(user?.id || '')
        window.dispatchEvent(new Event('profile-change'))
      }
      loadProfiles()
      setShowDeleteModal(false)
      setProfileToDelete(null)
      setDeletePinInput('')
      toast.success('Profile deleted successfully', {
        duration: 3000,
      })
    }
  }

  // Auto-submit delete PIN when 4 digits are entered
  useEffect(() => {
    if (deletePinInput.length === 4 && profileToDelete && showDeleteModal && profileToDelete.pin) {
      const timer = setTimeout(() => {
        confirmDeleteProfile()
      }, 300)
      return () => clearTimeout(timer)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [deletePinInput, profileToDelete, showDeleteModal])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 md:py-16 overflow-y-auto overflow-x-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-3 sm:mb-4">
          Who's watching?
        </h1>
        <p className="text-sm sm:text-base text-gray-400 text-center mb-8 sm:mb-12">
          Select a profile or create a new one
        </p>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleSelectProfile(profile)}
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg overflow-hidden bg-card border-2 border-transparent group-hover:border-primary transition-all duration-300 group-hover:scale-110 mb-3 sm:mb-4">
                {profile.avatarType === 'uploaded' && profile.avatar && (profile.avatar.startsWith('data:') || profile.avatar.startsWith('http')) ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl md:text-7xl">
                    {profile.avatar || '👤'}
                  </div>
                )}
                {profile.pin && (
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <Lock size={12} className="sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{profile.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingProfile(profile)
                    setShowCreateModal(true)
                  }}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-primary transition-colors"
                  aria-label="Edit profile"
                >
                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProfile(profile)
                    }}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete profile"
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {profiles.length < 5 && (
            <button
              onClick={() => {
                setEditingProfile(null)
                setShowCreateModal(true)
              }}
              className="flex flex-col items-center justify-center w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg bg-card border-2 border-dashed border-gray-700 hover:border-primary transition-all duration-300 hover:scale-110 group"
            >
              <Plus size={32} className="sm:w-12 sm:h-12 text-gray-400 group-hover:text-primary mb-1 sm:mb-2" />
              <span className="text-xs sm:text-base text-gray-400 group-hover:text-white">Add Profile</span>
            </button>
          )}
        </div>

        <div className="text-center">
          <Link href="/dashboard/settings">
            <Button variant="outline" className="group/btn font-semibold backdrop-blur-md">
              <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Manage Profiles</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* PIN Input Modal */}
      {showPinModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6 md:p-8 my-4 sm:my-auto animate-scale-in border border-white/10 glass max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
                <Lock size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enter PIN</h2>
              <p className="text-gray-400">
                This profile is protected. Please enter the 4-digit PIN to continue.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/30">
                  {selectedProfile.avatarType === 'uploaded' && selectedProfile.avatar && (selectedProfile.avatar.startsWith('data:') || selectedProfile.avatar.startsWith('http')) ? (
                    <img src={selectedProfile.avatar} alt={selectedProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10">
                      {selectedProfile.avatar || '👤'}
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold text-lg">{selectedProfile.name}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* PIN Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                  Enter 4-Digit PIN
                </label>
                <div className="flex justify-center space-x-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={pinInput[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value) {
                          const newPin = pinInput.split('')
                          newPin[index] = value
                          const updatedPin = newPin.join('').slice(0, 4)
                          setPinInput(updatedPin)
                          
                          // Auto-focus next input
                          if (value && index < 3) {
                            setTimeout(() => {
                              const nextInput = document.getElementById(`pin-${index + 1}`)
                              nextInput?.focus()
                            }, 10)
                          }
                        } else {
                          // Handle backspace/delete
                          const newPin = pinInput.split('')
                          newPin[index] = ''
                          setPinInput(newPin.join(''))
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (pinInput[index]) {
                            // Clear current digit
                            const newPin = pinInput.split('')
                            newPin[index] = ''
                            setPinInput(newPin.join(''))
                          } else if (index > 0) {
                            // Move to previous input
                            const prevInput = document.getElementById(`pin-${index - 1}`)
                            prevInput?.focus()
                            const newPin = pinInput.split('')
                            newPin[index - 1] = ''
                            setPinInput(newPin.join(''))
                          }
                        } else if (e.key === 'Enter' && pinInput.length === 4) {
                          handlePinSubmit()
                        }
                      }}
                      id={`pin-${index}`}
                      className="w-16 h-16 text-center text-2xl font-bold bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Status Message */}
              {pinInput.length === 4 && (
                <div className="flex items-center justify-center space-x-2 text-primary animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  <p className="text-sm font-medium">Verifying...</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPinModal(false)
                    setPinInput('')
                    setSelectedProfile(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {pinInput.length < 4 && (
                  <div className="flex-1 text-center text-sm text-gray-500">
                    Enter {4 - pinInput.length} more digit{4 - pinInput.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Forgot your PIN? Contact support to reset it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6 md:p-8 my-4 sm:my-auto animate-scale-in border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border-2 border-red-500/30">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Profile</h2>
              <p className="text-gray-400 mb-4">
                Are you sure you want to delete <span className="font-semibold text-white">{profileToDelete.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete this profile and all associated watch history and watchlist. This action cannot be undone.
              </p>
              
              {/* Profile Preview */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-red-500/30">
                  {profileToDelete.avatarType === 'uploaded' && profileToDelete.avatar && (profileToDelete.avatar.startsWith('data:') || profileToDelete.avatar.startsWith('http')) ? (
                    <img src={profileToDelete.avatar} alt={profileToDelete.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10">
                      {profileToDelete.avatar || '👤'}
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold text-lg">{profileToDelete.name}</span>
              </div>

              {/* PIN Input (if profile has PIN) */}
              {profileToDelete.pin && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                    Enter PIN to confirm deletion
                  </label>
                  <div className="flex justify-center space-x-3">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={deletePinInput[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value) {
                            const newPin = deletePinInput.split('')
                            newPin[index] = value
                            const updatedPin = newPin.join('').slice(0, 4)
                            setDeletePinInput(updatedPin)
                            
                            // Auto-focus next input
                            if (value && index < 3) {
                              setTimeout(() => {
                                const nextInput = document.getElementById(`delete-pin-${index + 1}`)
                                nextInput?.focus()
                              }, 10)
                            }
                          } else {
                            // Handle backspace/delete
                            const newPin = deletePinInput.split('')
                            newPin[index] = ''
                            setDeletePinInput(newPin.join(''))
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') {
                            if (deletePinInput[index]) {
                              // Clear current digit
                              const newPin = deletePinInput.split('')
                              newPin[index] = ''
                              setDeletePinInput(newPin.join(''))
                            } else if (index > 0) {
                              // Move to previous input
                              const prevInput = document.getElementById(`delete-pin-${index - 1}`)
                              prevInput?.focus()
                              const newPin = deletePinInput.split('')
                              newPin[index - 1] = ''
                              setDeletePinInput(newPin.join(''))
                            }
                          } else if (e.key === 'Enter' && deletePinInput.length === 4) {
                            confirmDeleteProfile()
                          }
                        }}
                        id={`delete-pin-${index}`}
                        className="w-16 h-16 text-center text-2xl font-bold bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  {deletePinInput.length === 4 && (
                    <div className="flex items-center justify-center space-x-2 text-red-500 animate-pulse mt-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <p className="text-sm font-medium">Verifying...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setProfileToDelete(null)
                    setDeletePinInput('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmDeleteProfile}
                  disabled={profileToDelete.pin && deletePinInput.length !== 4}
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                >
                  {profileToDelete.pin && deletePinInput.length !== 4 ? 'Enter PIN' : 'Delete Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <ProfileModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProfile(null)
          }}
          profile={editingProfile}
          userId={user?.id || ''}
          onSuccess={async (savedProfile) => {
            if (!savedProfile) return
            
            // Close modal first
            setShowCreateModal(false)
            setEditingProfile(null)
            
            // Reload profiles list and wait for it to complete
            await loadProfiles()
            
            // Small delay to ensure UI updates and state is refreshed
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // If a new profile was created (not editing), automatically select it
            if (!editingProfile && savedProfile.id) {
              // Re-fetch the profile to ensure we have the latest data
              try {
                const profileResponse = await fetch(`/api/profiles/${savedProfile.id}`, {
                  credentials: 'include',
                })
                if (profileResponse.ok) {
                  const latestProfile = await profileResponse.json()
                  proceedWithProfile(latestProfile)
                } else {
                  // Fallback to saved profile
                  proceedWithProfile(savedProfile)
                }
              } catch (error) {
                // Fallback to saved profile
                proceedWithProfile(savedProfile)
              }
            }
          }}
        />
      )}
    </div>
  )
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile | null
  userId: string
  onSuccess: (savedProfile?: UserProfile) => void
}

function ProfileModal({ isOpen, onClose, profile, userId, onSuccess }: ProfileModalProps) {
  const [name, setName] = useState(profile?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || '👤')
  const [avatarType, setAvatarType] = useState<'default' | 'uploaded'>(profile?.avatarType || 'default')
  const [uploadedAvatar, setUploadedAvatar] = useState<string>(profile?.avatarType === 'uploaded' ? profile.avatar : '')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isKidsProfile, setIsKidsProfile] = useState(profile?.isKidsProfile || false)
  const [saving, setSaving] = useState(false)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB. Please choose a smaller image.', {
        duration: 3000,
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedAvatar(reader.result as string)
      setAvatarType('uploaded')
    }
    reader.readAsDataURL(file)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    // Prevent double submission
    if (isSubmitting || saving) {
      return
    }

    if (!name.trim()) {
      toast.error('Please enter a profile name', {
        duration: 2500,
      })
      return
    }

    if (name.trim().length > 50) {
      toast.error('Profile name must be 50 characters or less', {
        duration: 2500,
      })
      return
    }

    if (pin && pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits', {
        duration: 2500,
      })
      return
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      toast.error('PIN must contain only numbers', {
        duration: 2500,
      })
      return
    }

    if (pin && pin !== confirmPin) {
      toast.error('PINs do not match. Please try again', {
        duration: 2500,
      })
      return
    }

    setIsSubmitting(true)
    setSaving(true)

    try {
      const profileData = {
        name: name.trim(),
        avatar: avatarType === 'uploaded' ? uploadedAvatar : selectedAvatar,
        avatarType,
        pin: pin || undefined,
        isKidsProfile,
      }

      let response
      if (profile) {
        // Update existing profile via API
        response = await fetch(`/api/profiles/${profile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(profileData),
        })
      } else {
        // Create new profile via API
        response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(profileData),
        })
      }

      if (response.ok) {
        const savedProfile = await response.json()
        
        // If creating a new profile, automatically set it as current
        if (!profile && savedProfile && savedProfile.id) {
          try {
            const setCurrentResponse = await fetch('/api/profiles/current', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ profileId: savedProfile.id }),
            })
            
            if (setCurrentResponse.ok) {
              // Dispatch event to notify other components
              window.dispatchEvent(new Event('profile-change'))
            } else {
              console.warn('Failed to set current profile, but profile was created')
            }
          } catch (error) {
            console.error('Failed to set current profile:', error)
            // Don't fail the whole operation if setting current profile fails
          }
        }
        
        toast.success(profile ? 'Profile updated successfully!' : 'Profile created successfully!', {
          duration: 2000,
        })
        
        // Call onSuccess after a brief delay to ensure toast is shown
        setTimeout(() => {
          onSuccess(savedProfile)
        }, 100)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save profile')
      }
    } catch (error: any) {
      console.error('Failed to save profile via API:', error)
      // Fallback to localStorage
      try {
        const profileData = {
          userId,
          name: name.trim(),
          avatar: avatarType === 'uploaded' ? uploadedAvatar : selectedAvatar,
          avatarType,
          pin: pin || undefined,
          isKidsProfile,
        }
        let savedProfile: UserProfile
        if (profile) {
          const updated = profileStorage.update(profile.id, profileData)
          if (!updated) {
            throw new Error('Profile not found')
          }
          savedProfile = updated
        } else {
          savedProfile = profileStorage.create(profileData)
        }
        toast.success(profile ? 'Profile updated successfully!' : 'Profile created successfully!', {
          duration: 2000,
        })
        // Call onSuccess after a brief delay to ensure toast is shown
        setTimeout(() => {
          onSuccess(savedProfile)
        }, 100)
      } catch (fallbackError: any) {
        toast.error(error.message || 'Failed to save profile. Please try again.', {
          duration: 4000,
        })
      }
    } finally {
      setSaving(false)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-4 sm:my-auto animate-scale-in border border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Avatar</label>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center border-2 border-primary">
                {avatarType === 'uploaded' && uploadedAvatar ? (
                  <img 
                    src={uploadedAvatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, fallback to emoji
                      setAvatarType('default')
                      setUploadedAvatar('')
                      toast.error('Failed to load image. Please check the URL or upload a file.', {
                        duration: 3000,
                      })
                    }}
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl">{selectedAvatar}</span>
                )}
              </div>
              <div className="flex-1 w-full sm:w-auto space-y-2">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="text-xs sm:text-sm text-white file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-light w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Or Enter Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={avatarType === 'uploaded' && uploadedAvatar && !uploadedAvatar.startsWith('data:') ? uploadedAvatar : ''}
                    onChange={(e) => {
                      const url = e.target.value.trim()
                      if (url) {
                        setUploadedAvatar(url)
                        setAvatarType('uploaded')
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-2 max-h-32 overflow-y-auto">
              {DEFAULT_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => {
                    setSelectedAvatar(avatar)
                    setAvatarType('default')
                  }}
                  className={`w-10 h-10 rounded text-2xl hover:scale-110 transition-all ${
                    selectedAvatar === avatar && avatarType === 'default'
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter profile name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={20}
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              PIN (Optional - 4 digits)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={4}
              />
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm PIN"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={4}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Set a PIN to protect this profile
            </p>
          </div>

          {/* Kids Profile */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="kidsProfile"
              checked={isKidsProfile}
              onChange={(e) => setIsKidsProfile(e.target.checked)}
              className="w-4 h-4 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary"
            />
            <label htmlFor="kidsProfile" className="text-sm text-gray-300">
              Kids Profile (restricted content)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || isSubmitting}
              className="flex-1 group/btn font-bold"
            >
              <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">
                {profile ? 'Update Profile' : 'Create Profile'}
              </span>
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 group/btn font-semibold backdrop-blur-md">
              <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Cancel</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProfilesPageContent />
    </Suspense>
  )
}

