import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses Prisma
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const watchHistory = await prisma.watchHistory.findMany({
      where: { userId: params.id },
      include: {
        movie: true,
        series: true,
        episode: true,
      },
      orderBy: { lastWatchedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(watchHistory)
  } catch (error) {
    console.error('Get watch history error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


