import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
    console.error('Token verification error:', error)
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current profile ID from cookie
    const currentProfileId = request.cookies.get('current-profile-id')?.value
    if (!currentProfileId) {
      return NextResponse.json(
        { message: 'No profile selected' },
        { status: 400 }
      )
    }

    // Verify profile belongs to user
    const profile = await prisma.userProfile.findUnique({
      where: { id: currentProfileId },
    })

    if (!profile || profile.userId !== userId) {
      return NextResponse.json(
        { message: 'Invalid profile' },
        { status: 403 }
      )
    }

    // Verify review exists
    const reviewExists = await prisma.review.findUnique({
      where: { id: params.reviewId },
    })

    if (!reviewExists) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if profile already marked this review as helpful
    const existingHelpful = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_profileId: {
          reviewId: params.reviewId,
          profileId: currentProfileId,
        },
      },
    })

    let review
    let helpful = false

    if (existingHelpful) {
      // Unhelpful: Remove helpful vote and decrement count
      await prisma.$transaction(async (tx) => {
        await tx.reviewHelpful.delete({
          where: { id: existingHelpful.id },
        })
        review = await tx.review.update({
          where: { id: params.reviewId },
          data: {
            helpful: { decrement: 1 },
          },
        })
      })
      helpful = false
    } else {
      // Helpful: Add helpful vote and increment count
      await prisma.$transaction(async (tx) => {
        await tx.reviewHelpful.create({
          data: {
            reviewId: params.reviewId,
            profileId: currentProfileId,
          },
        })
        review = await tx.review.update({
          where: { id: params.reviewId },
          data: {
            helpful: { increment: 1 },
          },
        })
      })
      helpful = true
    }

    return NextResponse.json({ 
      ...review, 
      userHelpful: helpful,
      helpful: review.helpful, // The count
    })
  } catch (error: any) {
    console.error('Mark helpful error:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'You have already marked this review as helpful' },
        { status: 409 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}




