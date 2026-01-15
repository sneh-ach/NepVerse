import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Force dynamic rendering - this route uses headers, cookies and Prisma
export const dynamic = 'force-dynamic'

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

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      const cookieToken = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value
      if (cookieToken) {
        const payload = verifyToken(cookieToken)
        return payload?.userId || null
      }
      return null
    }
    
    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    // Silent fail for token verification - will be handled by route
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contentType = searchParams.get('type') as 'movie' | 'series'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!contentType) {
      return NextResponse.json(
        { message: 'Content type is required' },
        { status: 400 }
      )
    }

    // Get current profile ID if user is authenticated
    const userId = await getUserId(request)
    const currentProfileId = userId ? request.cookies.get('current-profile-id')?.value : null

    const comments = await prisma.comment.findMany({
      where: {
        [contentType === 'movie' ? 'movieId' : 'seriesId']: params.id,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          include: { profile: true },
        },
        replies: {
          include: {
            user: {
              include: { profile: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        commentLikes: currentProfileId ? {
          where: { profileId: currentProfileId },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Map comments to include liked status
    const commentsWithLiked = comments.map(comment => ({
      ...comment,
      liked: currentProfileId ? comment.commentLikes?.length > 0 : false,
      replies: comment.replies?.map(reply => ({
        ...reply,
        liked: currentProfileId ? false : false, // Replies don't have likes in current schema
      })),
    }))

    return NextResponse.json(commentsWithLiked)
  } catch (error) {
    const { logError } = await import('@/lib/errorHandler')
    logError(error, 'Get comments', undefined, `/api/content/${params.id}/comments`)
    // Return empty array instead of error for better UX
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parentId } = body
    const contentType = body.type as 'movie' | 'series'

    if (!content || !contentType) {
      return NextResponse.json(
        { message: 'Content and type are required' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        [contentType === 'movie' ? 'movieId' : 'seriesId']: params.id,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Create comment')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


