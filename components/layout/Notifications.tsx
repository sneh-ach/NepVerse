'use client'

import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0

  useEffect(() => {
    if (user) {
      // Use localStorage for notifications
      try {
        const { notificationsStorage } = require('@/lib/clientStorage')
        const userNotifications = notificationsStorage.getByUser(user.id)
        setNotifications(Array.isArray(userNotifications) ? userNotifications : [])
      } catch (error) {
        console.error('Error loading notifications:', error)
        setNotifications([])
      }
    } else {
      setNotifications([])
    }
  }, [user])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      Array.isArray(prev) ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : []
    )
    try {
      const { notificationsStorage } = require('@/lib/clientStorage')
      notificationsStorage.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      Array.isArray(prev) ? prev.map((n) => ({ ...n, read: true })) : []
    )
    try {
      const { notificationsStorage } = require('@/lib/clientStorage')
      notificationsStorage.markAllAsRead(user?.id || '')
    } catch (error) {
      console.error('Error marking all as read:', error)
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
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold">
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
          <div className="absolute right-0 mt-2 w-80 glass rounded-lg shadow-2xl border border-white/10 z-50 max-h-96 overflow-y-auto animate-scale-in">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary-light"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-gray-800/50 transition-colors cursor-pointer
                      ${!notification.read ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0 mt-1" />
                      )}
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

