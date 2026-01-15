import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses Prisma
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const watchlist = await prisma.watchList.findMany({
      where: { userId: params.id },
      include: {
        movie: true,
        series: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(watchlist)
  } catch (error) {
    console.error('Get watchlist error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


