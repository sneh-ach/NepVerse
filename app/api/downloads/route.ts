import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) {
      const payload = verifyToken(cookieToken)
      if (payload) {
        return await prisma.user.findUnique({ where: { id: payload.userId } })
      }
    }
    return null
  }
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  return await prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const downloads = await prisma.download.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      include: {
        movie: true,
        series: true,
        episode: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(downloads)
  } catch (error) {
    console.error('Get downloads error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { movieId, seriesId, episodeId } = body

    if (!movieId && !seriesId && !episodeId) {
      return NextResponse.json(
        { message: 'Content ID is required' },
        { status: 400 }
      )
    }

    // TODO: Initiate download process
    // This would:
    // 1. Queue video for download
    // 2. Process and store locally
    // 3. Create download record

    const download = await prisma.download.create({
      data: {
        userId: user.id,
        movieId: movieId || null,
        seriesId: seriesId || null,
        episodeId: episodeId || null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    return NextResponse.json({ message: 'Download queued', download })
  } catch (error) {
    console.error('Create download error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


