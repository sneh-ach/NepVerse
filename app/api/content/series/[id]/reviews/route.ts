import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    // Get current profile ID if user is authenticated
    const userId = await getUserId(request)
    const currentProfileId = userId ? request.cookies.get('current-profile-id')?.value : null

    const reviews = await prisma.review.findMany({
      where: {
        seriesId: params.id,
      },
      include: {
        user: {
          include: { profile: true },
        },
        reviewHelpful: currentProfileId ? {
          where: { profileId: currentProfileId },
          take: 1,
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map reviews to include helpful status
    const reviewsWithHelpful = reviews.map(review => ({
      id: review.id,
      userId: review.userId,
      userName: review.user.profile?.firstName 
        ? `${review.user.profile.firstName} ${review.user.profile.lastName || ''}`.trim()
        : review.user.email || 'Anonymous',
      userAvatar: review.user.profile?.avatar,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      userHelpful: currentProfileId ? (Array.isArray(review.reviewHelpful) && review.reviewHelpful.length > 0) : false,
      createdAt: review.createdAt.toISOString(),
    }))

    return NextResponse.json({ reviews: reviewsWithHelpful })
  } catch (error) {
    const { logError } = await import('@/lib/errorHandler')
    logError(error, 'Get series reviews', undefined, `/api/content/series/${params.id}/reviews`)
    // Return empty array instead of error for better UX
    return NextResponse.json(
      { message: 'Reviews temporarily unavailable', reviews: [] },
      { status: 200 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: string | null = null
  try {
    userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input with Zod
    const { validate, reviewSchema } = await import('@/lib/validation')
    const validation = validate(reviewSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const { rating, comment } = validation.data

    // Verify series exists - but allow reviews for mock data (fallback to localStorage)
    const series = await prisma.series.findUnique({
      where: { id: params.id },
    })

    if (!series) {
      // Series not in database - this might be mock data
      // Return a more helpful message
      return NextResponse.json(
        { message: 'Series not found in database. This content may not be available yet.' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this series
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        seriesId: params.id,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this series' },
        { status: 400 }
      )
    }

    // Save review to database
    const review = await prisma.review.create({
      data: {
        userId,
        seriesId: params.id,
        rating,
        comment: comment.trim(),
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: {
        id: review.id,
        userId: review.userId,
        userName: review.user.profile?.firstName 
          ? `${review.user.profile.firstName} ${review.user.profile.lastName || ''}`.trim()
          : review.user.email || 'Anonymous',
        userAvatar: review.user.profile?.avatar,
        rating: review.rating,
        comment: review.comment,
        helpful: review.helpful,
        userHelpful: false,
        createdAt: review.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    const { logError, handleError } = await import('@/lib/errorHandler')
    logError(error, 'Submit series review', userId, `/api/content/series/${params.id}/reviews`)
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Series not found in database', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'You have already reviewed this series', code: 'DUPLICATE_REVIEW' },
        { status: 409 }
      )
    }
    
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
