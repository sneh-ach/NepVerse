import { PrismaClient } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

// Force include Prisma engine by importing these modules
import './prisma-import'
import './force-prisma-include'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma with production-ready settings
let prismaInstance: PrismaClient

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      // Connection pool settings (also configurable via DATABASE_URL)
      // Example DATABASE_URL: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
      // Query timeout: 30 seconds (configurable via DATABASE_URL query parameter)
    })
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error)
  // In production, we want to know about this immediately
  if (process.env.NODE_ENV === 'production') {
    console.error('Prisma initialization error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      nodeVersion: process.version,
      platform: process.platform,
      // Log Prisma engine search paths
      prismaPaths: [
        process.cwd() + '/node_modules/.prisma/client',
        process.cwd() + '/node_modules/@prisma/client',
        __dirname + '/../node_modules/.prisma/client',
        __dirname + '/../node_modules/@prisma/client',
      ],
    })
  }
  throw error
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (typeof process !== 'undefined') {
  const gracefulShutdown = async () => {
    await prisma.$disconnect()
  }
  
  process.on('beforeExit', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
}

/**
 * Execute a Prisma query with timeout
 * @param queryFn The Prisma query function to execute
 * @param timeoutMs Timeout in milliseconds (default: 30000)
 */
export async function withQueryTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}




