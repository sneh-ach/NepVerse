import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheService } from '@/lib/cache'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: 'connected' | 'disconnected' | 'error'
    redis?: 'connected' | 'disconnected' | 'not_configured'
  }
  uptime: number
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

/**
 * GET /api/health
 * Comprehensive health check endpoint for monitoring
 * Returns detailed status of all services
 */
export async function GET() {
  const startTime = Date.now()
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'disconnected',
    },
    uptime: process.uptime(),
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart
    
    health.services.database = 'connected'
    
    // If database takes too long, mark as degraded
    if (dbTime > 1000) {
      health.status = 'degraded'
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.services.database = 'error'
  }

  // Check Redis connection (if configured)
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      await cacheService.get('health-check')
      health.services.redis = 'connected'
    } catch (error) {
      health.services.redis = 'disconnected'
      if (health.status === 'healthy') {
        health.status = 'degraded'
      }
    }
  } else {
    health.services.redis = 'not_configured'
  }

  // Add memory usage (if available)
  if (typeof process.memoryUsage === 'function') {
    const memory = process.memoryUsage()
    health.memory = {
      used: Math.round(memory.heapUsed / 1024 / 1024),
      total: Math.round(memory.heapTotal / 1024 / 1024),
      percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
    }
  }

  const statusCode = health.status === 'unhealthy' ? 503 : health.status === 'degraded' ? 200 : 200

  return NextResponse.json(health, { status: statusCode })
}


