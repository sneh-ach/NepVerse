import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createActivity } from '@/lib/achievements'
import { cacheService } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

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
 * GET /api/playlists
 * Get playlists (user's own or public)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const searchParams = request.nextUrl.searchParams
    const userIdParam = searchParams.get('userId')
    const visibility = searchParams.get('visibility') // 'PUBLIC', 'PRIVATE', 'UNLISTED'

    let where: any = {}

    if (userIdParam) {
      // Get specific user's playlists
      where.userId = userIdParam
      if (userId !== userIdParam) {
        // Only show public playlists if not own
        where.visibility = 'PUBLIC'
      }
    } else if (userId) {
      // Get current user's playlists
      where.userId = userId
    } else {
      // Not authenticated - only public playlists
      where.visibility = 'PUBLIC'
    }

    if (visibility) {
      where.visibility = visibility
    }

    const playlists = await prisma.playlist.findMany({
      where,
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
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formatted = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      visibility: playlist.visibility,
      coverImage: playlist.coverImage,
      itemCount: playlist._count.items,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
      userName: playlist.user.profile?.firstName
        ? `${playlist.user.profile.firstName} ${playlist.user.profile.lastName || ''}`.trim()
        : playlist.user.email || 'Anonymous',
      userAvatar: playlist.user.profile?.avatar,
      isOwn: userId === playlist.userId,
    }))

    const responseData = { playlists: formatted }

    // Cache for GET requests
    if (request.method === 'GET') {
      const cacheKey = `playlists:${userIdParam || userId || 'public'}:${visibility || 'all'}`
      await cacheService.set(cacheKey, responseData, { ttl: 300 })
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get playlists')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}

/**
 * POST /api/playlists
 * Create a new playlist
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, visibility = 'PRIVATE', coverImage } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'Playlist name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { message: 'Playlist name must be 100 characters or less' },
        { status: 400 }
      )
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        visibility: visibility || 'PRIVATE',
        coverImage: coverImage || null,
      },
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
    })

    // Invalidate cache
    await cacheService.delete(`playlists:${userId}:all`)

    // Create activity
    await createActivity(userId, 'CREATED_PLAYLIST', null, null, {
      playlistName: playlist.name,
      playlistId: playlist.id,
    })

    return NextResponse.json({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      visibility: playlist.visibility,
      coverImage: playlist.coverImage,
      itemCount: playlist._count.items,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Create playlist')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
