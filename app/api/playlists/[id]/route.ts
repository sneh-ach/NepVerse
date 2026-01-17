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
 * GET /api/playlists/[id]
 * Get a specific playlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        items: {
          include: {
            movie: true,
            series: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json(
        { message: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Check visibility
    if (playlist.visibility === 'PRIVATE' && playlist.userId !== userId) {
      return NextResponse.json(
        { message: 'Playlist is private' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      visibility: playlist.visibility,
      coverImage: playlist.coverImage,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
      userName: playlist.user.profile?.firstName
        ? `${playlist.user.profile.firstName} ${playlist.user.profile.lastName || ''}`.trim()
        : playlist.user.email || 'Anonymous',
      userAvatar: playlist.user.profile?.avatar,
      isOwn: userId === playlist.userId,
      items: playlist.items.map(item => ({
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
      })),
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get playlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * PUT /api/playlists/[id]
 * Update a playlist
 */
export async function PUT(
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
    const { name, description, visibility, coverImage } = body

    const updated = await prisma.playlist.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(visibility && { visibility }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
      },
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      visibility: updated.visibility,
      coverImage: updated.coverImage,
      itemCount: updated._count.items,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Update playlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * DELETE /api/playlists/[id]
 * Delete a playlist
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

    await prisma.playlist.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Playlist deleted' })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Delete playlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
