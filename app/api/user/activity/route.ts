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
 * GET /api/user/activity
 * Get activity feed for user (or users they follow)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const followingOnly = searchParams.get('following') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    let where: any = {}

    if (followingOnly) {
      // Get users that this user follows
      const following = await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      })
      const followingIds = following.map(f => f.followingId)
      followingIds.push(userId) // Include own activities
      where.userId = { in: followingIds }
    } else {
      // Get all activities (public feed)
      where = {}
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.activity.count({ where })

    // Format activities
    const formatted = activities.map(activity => {
      const userName = activity.user.profile?.firstName
        ? `${activity.user.profile.firstName} ${activity.user.profile.lastName || ''}`.trim()
        : activity.user.email || 'Anonymous'

      return {
        id: activity.id,
        type: activity.type,
        userName,
        userAvatar: activity.user.profile?.avatar,
        contentId: activity.contentId,
        contentType: activity.contentType,
        metadata: activity.metadata,
        createdAt: activity.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      activities: formatted,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Get activity feed')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
