// Analytics and tracking utilities
// Supports Google Analytics and custom event tracking

interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

class Analytics {
  private gaId: string | null = null
  private enabled: boolean = false

  constructor() {
    this.gaId = process.env.NEXT_PUBLIC_GA_ID || null
    this.enabled = typeof window !== 'undefined' && !!this.gaId
  }

  // Track page view
  pageView(path: string, title?: string) {
    if (!this.enabled) return

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.gaId, {
        page_path: path,
        page_title: title,
      })
    }
  }

  // Track custom event
  event(event: AnalyticsEvent) {
    if (!this.enabled) return

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      })
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event)
    }
  }

  // Track video play
  trackVideoPlay(contentId: string, contentType: 'movie' | 'series', title: string) {
    this.event({
      action: 'play',
      category: 'video',
      label: `${contentType}:${contentId}`,
    })
  }

  // Track video completion
  trackVideoComplete(contentId: string, contentType: 'movie' | 'series', duration: number) {
    this.event({
      action: 'complete',
      category: 'video',
      label: `${contentType}:${contentId}`,
      value: duration,
    })
  }

  // Track subscription
  trackSubscription(planId: string, amount: number) {
    this.event({
      action: 'purchase',
      category: 'subscription',
      label: planId,
      value: amount,
    })
  }

  // Track search
  trackSearch(query: string, resultsCount: number) {
    this.event({
      action: 'search',
      category: 'content',
      label: query,
      value: resultsCount,
    })
  }

  // Track content view
  trackContentView(contentId: string, contentType: 'movie' | 'series') {
    this.event({
      action: 'view',
      category: 'content',
      label: `${contentType}:${contentId}`,
    })
  }
}

export const analytics = new Analytics()


