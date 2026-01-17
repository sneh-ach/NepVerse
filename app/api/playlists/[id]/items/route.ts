import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      const cookieToken = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value
      if (cookieToken) {
        const { verifyToken } = await import('@/lib/auth')
        const payload = verifyToken(cookieToken)
        return payload?.userId || null
      }
      return null
    }
    
    const { verifyToken } = await import('@/lib/auth')
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    return null
  }
}

/**
 * POST /api/playlists/[id]/items
 * Add item to playlist
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    })

    if (!playlist) {
      return NextResponse.json(
        { message: 'Playlist not found' },
        { status: 404 }
      )
    }

    if (playlist.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { movieId, seriesId } = body

    if (!movieId && !seriesId) {
      return NextResponse.json(
        { message: 'Either movieId or seriesId is required' },
        { status: 400 }
      )
    }

    // Get current max order
    const maxOrder = await prisma.playlistItem.findFirst({
      where: { playlistId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrder?.order || 0) + 1

    // Check if already in playlist
    const existing = await prisma.playlistItem.findFirst({
      where: {
        playlistId: params.id,
        ...(movieId ? { movieId } : { seriesId }),
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Item already in playlist' },
        { status: 400 }
      )
    }

    const item = await prisma.playlistItem.create({
      data: {
        playlistId: params.id,
        movieId: movieId || null,
        seriesId: seriesId || null,
        order: newOrder,
      },
      include: {
        movie: true,
        series: true,
      },
    })

    return NextResponse.json({
      id: item.id,
      movie: item.movie ? {
        id: item.movie.id,
        title: item.movie.title,
        posterUrl: item.movie.posterUrl,
      } : null,
      series: item.series ? {
        id: item.series.id,
        title: item.series.title,
        posterUrl: item.series.posterUrl,
      } : null,
      order: item.order,
      addedAt: item.addedAt.toISOString(),
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Add playlist item')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/playlists/[id]/items
 * Remove item from playlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
    })

    if (!playlist) {
      return NextResponse.json(
        { message: 'Playlist not found' },
        { status: 404 }
      )
    }

    if (playlist.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { message: 'Item ID is required' },
        { status: 400 }
      )
    }

    await prisma.playlistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Item removed from playlist' })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Remove playlist item')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
