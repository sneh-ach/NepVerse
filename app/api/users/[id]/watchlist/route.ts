import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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


