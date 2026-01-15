import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/health/prisma
 * Health check endpoint to test Prisma connection
 */
export async function GET() {
  try {
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    return NextResponse.json({
      status: 'ok',
      prisma: 'connected',
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        prisma: 'failed',
        error: {
          message: error?.message || 'Unknown error',
          code: error?.code,
          meta: error?.meta,
          name: error?.name,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
