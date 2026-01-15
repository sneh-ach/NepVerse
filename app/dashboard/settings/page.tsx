'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Save, User, Lock, Bell, Globe } from 'lucide-react'
import { authService, accountService, preferencesService } from '@/lib/clientStorage'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, mutate } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'preferences' | 'notifications'>('profile')
  const [isSaving, setIsSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    avatar: '',
    country: '',
    language: 'ne',
  })

  const [accountData, setAccountData] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [preferences, setPreferences] = useState({
    autoplay: true,
    autoplayNext: true,
    defaultQuality: 'auto' as 'auto' | '360p' | '720p' | '1080p',
    defaultSubtitle: 'off' as 'off' | 'nepali' | 'english',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/settings')
    } else if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        avatar: user.profile?.avatar || '',
        country: user.profile?.country || '',
        language: user.profile?.language || 'ne',
      })
      
      // Fetch account data from API to ensure we have the latest data
      const fetchAccountData = async () => {
        try {
          const response = await fetch('/api/user/account', {
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            setAccountData({
              email: data.email || user.email || '',
              phone: data.phone || user.phone || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
          } else {
            // Fallback to user object if API fails
            setAccountData({
              email: user.email || '',
              phone: user.phone || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
          }
        } catch (error) {
          // Fallback to user object if API fails
          setAccountData({
            email: user.email || '',
            phone: user.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        }
      }
      
      fetchAccountData()
      
      // Load preferences from localStorage
      try {
        const savedPreferences = preferencesService.getPreferences()
        if (savedPreferences) {
          setPreferences({
            autoplay: savedPreferences.autoplay ?? true,
            autoplayNext: savedPreferences.autoplayNext ?? true,
            defaultQuality: savedPreferences.defaultQuality || 'auto',
            defaultSubtitle: savedPreferences.defaultSubtitle || 'off',
          })
        }
      } catch (error) {
        // Use defaults if preferences can't be loaded
      }
    }
  }, [user, loading, router])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      authService.updateProfile(profileData)
      toast.success('Profile updated successfully!', {
        duration: 3000,
      })
      mutate()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile. Please try again.', {
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAccount = async () => {
    if (accountData.newPassword && accountData.newPassword !== accountData.confirmPassword) {
      toast.error('Passwords do not match. Please try again.', {
        duration: 3000,
      })
      return
    }

    setIsSaving(true)
    try {
      accountService.updateAccount({
        email: accountData.email,
        phone: accountData.phone,
        currentPassword: accountData.currentPassword,
        newPassword: accountData.newPassword,
      })
      toast.success('Account updated successfully!', {
        duration: 3000,
      })
      setAccountData({
        ...accountData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      mutate()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account. Please try again.', {
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      preferencesService.updatePreferences(preferences)
      toast.success('Preferences saved successfully!', {
        duration: 3000,
      })
      mutate()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences. Please try again.', {
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Avatar URL"
                value={profileData.avatar}
                onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                placeholder="https://..."
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <select
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-gray-700 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600"
                  >
                    <option value="">Select Country</option>
                    <option value="NP">Nepal</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    value={profileData.language}
                    onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                    className="w-full px-4 py-3 bg-card border border-gray-700 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600"
                  >
                    <option value="ne">Nepali (नेपाली)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                isLoading={isSaving}
                className="flex items-center space-x-2 group/btn font-bold"
              >
                <Save size={20} className="group-hover/btn:scale-110 transition-transform duration-300" />
                <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Save Changes</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={accountData.email}
                onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                disabled
              />
              <Input
                label="Phone"
                type="tel"
                value={accountData.phone}
                onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                disabled
              />
              <div className="border-t border-gray-800 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={accountData.currentPassword}
                    onChange={(e) => setAccountData({ ...accountData, currentPassword: e.target.value })}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={accountData.newPassword}
                    onChange={(e) => setAccountData({ ...accountData, newPassword: e.target.value })}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={accountData.confirmPassword}
                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleSaveAccount}
                isLoading={isSaving}
                className="flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Playback Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Autoplay</h3>
                  <p className="text-gray-400 text-sm">Automatically play videos when selected</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoplay}
                    onChange={(e) => setPreferences({ ...preferences, autoplay: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Autoplay Next Episode</h3>
                  <p className="text-gray-400 text-sm">Automatically play next episode in a series</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoplayNext}
                    onChange={(e) => setPreferences({ ...preferences, autoplayNext: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Video Quality</label>
                <select
                  value={preferences.defaultQuality}
                  onChange={(e) => {
                    const value = e.target.value as 'auto' | '360p' | '720p' | '1080p'
                    setPreferences({ ...preferences, defaultQuality: value })
                  }}
                  className="w-full px-4 py-3 bg-card border border-gray-700 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600"
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="360p">360p</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Subtitle Language</label>
                <select
                  value={preferences.defaultSubtitle}
                  onChange={(e) => {
                    const value = e.target.value as 'off' | 'nepali' | 'english'
                    setPreferences({ ...preferences, defaultSubtitle: value })
                  }}
                  className="w-full px-4 py-3 bg-card border border-gray-700 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600"
                >
                  <option value="off">Off</option>
                  <option value="nepali">Nepali</option>
                  <option value="english">English</option>
                </select>
              </div>

              <Button
                variant="primary"
                onClick={handleSavePreferences}
                isLoading={isSaving}
                className="flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save Preferences</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Notification Settings</h2>
            <div className="space-y-4">
              <div className="text-center py-12">
                <Bell size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Notification Settings</p>
                <p className="text-gray-500 text-sm">Customize your notification preferences (coming soon)</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

