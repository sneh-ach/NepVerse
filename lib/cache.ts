// Caching service with Redis support
// Falls back to in-memory cache if Redis is not configured

interface CacheOptions {
  ttl?: number // Time to live in seconds
}

class CacheService {
  private redisClient: any = null
  private memoryCache: Map<string, { value: any; expires: number }> = new Map()
  private isRedisAvailable: boolean = false

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('Redis not configured, using in-memory cache')
      }
      return
    }

    try {
      // Dynamic import to avoid SSR issues
      const Redis = (await import('ioredis')).default
      this.redisClient = new Redis(redisUrl)
      this.isRedisAvailable = true
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Redis connected for caching')
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Redis connection failed:', error)
      }
      this.isRedisAvailable = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const value = await this.redisClient.get(key)
        return value ? JSON.parse(value) : null
      } catch (error) {
        console.error('Redis get error:', error)
        return this.getFromMemory<T>(key)
      }
    }

    return this.getFromMemory<T>(key)
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || 3600 // Default 1 hour

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.setex(key, ttl, JSON.stringify(value))
        return
      } catch (error) {
        console.error('Redis set error:', error)
      }
    }

    this.setInMemory(key, value, ttl)
  }

  async delete(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key)
        return
      } catch (error) {
        console.error('Redis delete error:', error)
      }
    }

    this.memoryCache.delete(key)
  }

  async clear(pattern?: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (pattern) {
          const keys = await this.redisClient.keys(pattern)
          if (keys.length > 0) {
            await this.redisClient.del(...keys)
          }
        } else {
          await this.redisClient.flushdb()
        }
        return
      } catch (error) {
        console.error('Redis clear error:', error)
      }
    }

    if (pattern) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key)
        }
      }
    } else {
      this.memoryCache.clear()
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    if (cached.expires < Date.now()) {
      this.memoryCache.delete(key)
      return null
    }

    return cached.value as T
  }

  private setInMemory(key: string, value: any, ttl: number): void {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    })

    // Clean up expired entries periodically
    if (this.memoryCache.size > 1000) {
      this.cleanupMemoryCache()
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expires < now) {
        this.memoryCache.delete(key)
      }
    }
  }

  // Cache wrapper for async functions
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fn()
    await this.set(key, value, options)
    return value
  }
}

export const cacheService = new CacheService()


