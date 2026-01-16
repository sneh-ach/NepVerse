'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, Film, Tv, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getImageUrl } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'new_movie' | 'new_series' | 'system' | 'promotion'
  link?: string | null
  imageUrl?: string | null
  read: boolean
  createdAt: string | Date
}

export function Notifications() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      console.log('[Notifications UI] 🔔 Loading notifications for user:', user.id)
      const response = await fetch('/api/notifications?limit=20', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Notifications UI] 📬 Received notifications:', {
          count: data.notifications?.length || 0,
          unreadCount: data.unreadCount || 0,
          total: data.total || 0,
        })
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } else {
        console.error('[Notifications UI] ❌ Failed to load notifications:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('[Notifications UI] Error details:', errorData)
      }
    } catch (error) {
      console.error('[Notifications UI] ❌ Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId: id }),
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert on error
      loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true }),
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
      loadNotifications()
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_movie':
        return <Film size={16} className="text-primary" />
      case 'new_series':
        return <Tv size={16} className="text-primary" />
      case 'promotion':
        return <Sparkles size={16} className="text-yellow-500" />
      default:
        return <Bell size={16} className="text-gray-400" />
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 glass rounded-lg shadow-2xl border border-white/10 z-50 max-h-[500px] overflow-y-auto animate-scale-in">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm">
              <h3 className="text-white font-semibold text-lg">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-gray-800/50 transition-colors cursor-pointer
                      ${!notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon or Image */}
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.imageUrl ? (
                          <div className="w-12 h-16 rounded overflow-hidden bg-gray-700">
                            <img 
                              src={getImageUrl(notification.imageUrl)} 
                              alt={notification.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

