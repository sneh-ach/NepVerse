'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, User, Menu, X } from 'lucide-react'
import { Notifications } from './Notifications'
import { Button } from '@/components/ui/Button'
import { cn, getImageUrl } from '@/lib/utils'
import { profileStorage, UserProfile } from '@/lib/localStorage'
export function Header() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadCurrentProfile = async () => {
      if (user) {
        try {
          const response = await fetch('/api/profiles/current', {
            credentials: 'include',
          })
          if (response.ok) {
            const profile = await response.json()
            setCurrentProfile(profile)
          } else {
            // Fallback to localStorage
            const profile = profileStorage.getCurrentProfile(user.id)
            setCurrentProfile(profile)
          }
        } catch (error) {
          // Fallback to localStorage
          const profile = profileStorage.getCurrentProfile(user.id)
          setCurrentProfile(profile)
        }
      } else {
        setCurrentProfile(null)
      }
    }

    loadCurrentProfile()

    const handleProfileChange = async () => {
      if (user) {
        try {
          const response = await fetch('/api/profiles/current', {
            credentials: 'include',
          })
          if (response.ok) {
            const profile = await response.json()
            setCurrentProfile(profile)
          } else {
            const profile = profileStorage.getCurrentProfile(user.id)
            setCurrentProfile(profile)
          }
        } catch (error) {
          const profile = profileStorage.getCurrentProfile(user.id)
          setCurrentProfile(profile)
        }
      }
    }

    window.addEventListener('profile-change', handleProfileChange)
    return () => window.removeEventListener('profile-change', handleProfileChange)
  }, [user?.id]) // Only depend on user.id, not the whole user object

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery('')
      setSearchSuggestions([])
    }
  }

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([])
      return
    }

    let mounted = true
    const timer = setTimeout(async () => {
      try {
        if (!mounted) return
        
        const query = searchQuery.toLowerCase()
        if (query.length < 2) {
          setSearchSuggestions([])
          return
        }
        
        try {
          const res = await fetch(`/api/content/search?q=${encodeURIComponent(query)}&limit=5`)
          if (res.ok) {
            const results = await res.json()
            if (mounted) {
              setSearchSuggestions(results)
            }
          }
        } catch (error) {
          // Ignore search errors
          if (mounted) {
            setSearchSuggestions([])
          }
        }
      } catch (error) {
        // Ignore
      }
    }, 300)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-background/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">NepVerse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={cn(
                "transition-colors font-medium",
                isActive('/') 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-white hover:text-primary"
              )}
            >
              Home
            </Link>
            <Link 
              href="/browse" 
              className={cn(
                "transition-colors font-medium",
                isActive('/browse') 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-white hover:text-primary"
              )}
            >
              Browse
            </Link>
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className={cn(
                    "transition-colors font-medium",
                    isActive('/dashboard') && !isActive('/dashboard/history') && !isActive('/dashboard/settings') && !isActive('/dashboard/subscription')
                      ? "text-red-500 hover:text-red-400" 
                      : "text-white hover:text-primary"
                  )}
                >
                  My List
                </Link>
                <Link 
                  href="/dashboard/history" 
                  className={cn(
                    "transition-colors font-medium",
                    isActive('/dashboard/history') 
                      ? "text-red-500 hover:text-red-400" 
                      : "text-white hover:text-primary"
                  )}
                >
                  History
                </Link>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="relative">
                  <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search movies, series..."
                        className="px-4 py-2 bg-card border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600 w-64 pr-10"
                        autoFocus
                        aria-label="Search content"
                      />
                      <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                        setSearchSuggestions([])
                      }}
                      className="text-white hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                      aria-label="Close search"
                    >
                      <X size={20} />
                    </button>
                  </form>
                  
                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-gray-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto glass">
                      {searchSuggestions.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/${'episodeCount' in item ? 'series' : 'movie'}/${item.id}`}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                          onClick={() => {
                            setSearchOpen(false)
                            setSearchQuery('')
                            setSearchSuggestions([])
                          }}
                        >
                          <div className="w-12 h-16 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                            <img src={getImageUrl(item.posterUrl)} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{item.title}</p>
                            <p className="text-gray-400 text-xs">
                              {'episodeCount' in item ? 'Series' : 'Movie'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-white hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                  aria-label="Open search"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Notifications />
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-white hover:text-primary transition-colors"
                  >
                    {currentProfile ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-primary">
                        {currentProfile.avatarType === 'uploaded' && currentProfile.avatar && (currentProfile.avatar.startsWith('data:') || currentProfile.avatar.startsWith('http')) ? (
                          <img src={currentProfile.avatar} alt={currentProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg bg-primary">
                            {currentProfile.avatar || '👤'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User size={16} />
                      </div>
                    )}
                  </button>
                  {showProfileMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg z-50 border border-white/10 glass">
                        <div className="py-2">
                          {currentProfile && (
                            <div className="px-4 py-2 border-b border-gray-800">
                              <p className="text-white font-semibold text-sm">{currentProfile.name}</p>
                              <p className="text-gray-400 text-xs">{user?.email}</p>
                            </div>
                          )}
                          <Link
                            href="/profiles"
                            className="block px-4 py-2 text-white hover:bg-card-hover transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            Switch Profile
                          </Link>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-white hover:bg-card-hover transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            className="block px-4 py-2 text-white hover:bg-card-hover transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              setShowProfileMenu(false)
                              logout()
                            }}
                            className="block w-full text-left px-4 py-2 text-white hover:bg-card-hover transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => router.push('/signup')}>
                  Join NepVerse
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-white hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <Link
              href="/"
              className={cn(
                "block py-2 transition-colors font-medium",
                isActive('/') 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-white hover:text-primary"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/browse"
              className={cn(
                "block py-2 transition-colors font-medium",
                isActive('/browse') 
                  ? "text-red-500 hover:text-red-400" 
                  : "text-white hover:text-primary"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "block py-2 transition-colors font-medium",
                    isActive('/dashboard') && !isActive('/dashboard/history') && !isActive('/dashboard/settings') && !isActive('/dashboard/subscription')
                      ? "text-red-500 hover:text-red-400" 
                      : "text-white hover:text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/history"
                  className={cn(
                    "block py-2 transition-colors font-medium",
                    isActive('/dashboard/history') 
                      ? "text-red-500 hover:text-red-400" 
                      : "text-white hover:text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

