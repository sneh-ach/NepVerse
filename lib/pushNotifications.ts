// Push notification service
// Supports browser push notifications and mobile push (FCM/APNS)

export interface PushNotification {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: NotificationAction[]
}

class PushNotificationService {
  private vapidPublicKey: string | null = null
  private fcmServerKey: string | null = null

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    this.fcmServerKey = process.env.FCM_SERVER_KEY || null
  }

  // Request browser notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Send browser push notification
  async sendBrowserNotification(notification: PushNotification): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.ready

    await serviceWorkerRegistration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      image: notification.image,
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag,
      data: notification.data,
      requireInteraction: notification.requireInteraction,
      actions: notification.actions,
    })
  }

  // Send mobile push notification (FCM)
  async sendMobileNotification(
    deviceToken: string,
    notification: PushNotification,
    platform: 'android' | 'ios'
  ): Promise<boolean> {
    if (!this.fcmServerKey) {
      console.error('FCM server key not configured')
      return false
    }

    try {
      const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send'
      const payload: any = {
        to: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          badge: notification.badge,
        },
        data: notification.data,
      }

      if (platform === 'ios') {
        payload.apns = {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        }
      }

      const response = await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.fcmServerKey}`,
        },
        body: JSON.stringify(payload),
      })

      return response.ok
    } catch (error) {
      console.error('FCM notification error:', error)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidPublicKey
          ? this.urlBase64ToUint8Array(this.vapidPublicKey)
          : undefined,
      })

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: JSON.stringify(subscription),
        }),
      })

      return subscription
    } catch (error) {
      console.error('Push subscription error:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: JSON.stringify(subscription),
          }),
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Push unsubscribe error:', error)
      return false
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

export const pushNotificationService = new PushNotificationService()


