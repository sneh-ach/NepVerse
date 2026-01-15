// Rate limiter with Redis support for production
// Falls back to in-memory cache if Redis is not configured

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private maxRequests: number
  private windowMs: number
  private cleanupInterval: NodeJS.Timeout
  private redisClient: any = null
  private isRedisAvailable: boolean = false

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    
    // Initialize Redis if available
    this.initializeRedis()
    
    // Clean up expired entries every minute (for in-memory fallback)
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      if (process.env.NODE_ENV === 'production' && process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  REDIS_URL not set in production. Rate limiting will use in-memory store (not suitable for multi-instance deployments)')
      }
      return
    }

    try {
      const Redis = (await import('ioredis')).default
      this.redisClient = new Redis(redisUrl)
      this.isRedisAvailable = true
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Redis connected for rate limiting')
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Redis connection failed for rate limiting:', error)
      }
      this.isRedisAvailable = false
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    }
  }

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // Use Redis if available (for production with multiple instances)
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const key = `rate_limit:${identifier}`
        const now = Date.now()
        const windowStart = now - this.windowMs
        
        // Get current count
        const count = await this.redisClient.zcount(key, windowStart, now)
        
        if (count >= this.maxRequests) {
          // Get oldest entry to determine reset time
          const oldest = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES')
          const resetTime = oldest.length > 0 ? parseInt(oldest[1]) + this.windowMs : now + this.windowMs
          
          return {
            allowed: false,
            remaining: 0,
            resetTime,
          }
        }
        
        // Add current request
        await this.redisClient.zadd(key, now, `${now}-${Math.random()}`)
        await this.redisClient.expire(key, Math.ceil(this.windowMs / 1000))
        
        // Clean up old entries
        await this.redisClient.zremrangebyscore(key, 0, windowStart)
        
        return {
          allowed: true,
          remaining: this.maxRequests - count - 1,
          resetTime: now + this.windowMs,
        }
      } catch (error) {
        console.error('Redis rate limit error, falling back to memory:', error)
        // Fall through to in-memory
      }
    }
    
    // In-memory fallback (for development or if Redis fails)
    const now = Date.now()
    const entry = this.store[identifier]

    if (!entry || entry.resetTime < now) {
      // Create new entry
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store = {}
  }
}

// Create rate limiter instances
export const apiRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
)

export const authRateLimiter = new RateLimiter(5, 60000) // 5 requests per minute for auth
export const emailRateLimiter = new RateLimiter(3, 3600000) // 3 emails per hour

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip
}


