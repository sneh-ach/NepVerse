// Utility functions

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    NPR: 'ne-NP',
    INR: 'hi-IN',
    EUR: 'en-US',
    GBP: 'en-GB',
  }

  const locale = localeMap[currency] || 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'NPR' ? 0 : 2,
    maximumFractionDigits: currency === 'NPR' ? 0 : 2,
  }).format(amount)
}

/**
 * Rewrite image URLs from production to localhost when in development
 * This ensures images work correctly when running locally
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return url || ''
  
  // Always rewrite Vercel URLs to localhost in development
  // Check both client and server side
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isLocalhost = typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : true // Assume localhost on server side in development
  
  if (isDevelopment && isLocalhost && url.includes('nepverse.vercel.app')) {
    const baseUrl = typeof window !== 'undefined' 
      ? `http://${window.location.host}`
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    return url.replace('https://nepverse.vercel.app', baseUrl)
  }
  
  return url
}
