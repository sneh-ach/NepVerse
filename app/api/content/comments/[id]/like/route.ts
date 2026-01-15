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
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
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

    // Check if profile already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_profileId: {
          commentId: params.id,
          profileId: currentProfileId,
        },
      },
    })

    let comment
    let liked = false

    if (existingLike) {
      // Unlike: Remove like and decrement count
      await prisma.$transaction(async (tx) => {
        await tx.commentLike.delete({
          where: { id: existingLike.id },
        })
        comment = await tx.comment.update({
          where: { id: params.id },
          data: {
            likes: { decrement: 1 },
          },
        })
      })
      liked = false
    } else {
      // Like: Add like and increment count
      await prisma.$transaction(async (tx) => {
        await tx.commentLike.create({
          data: {
            commentId: params.id,
            profileId: currentProfileId,
          },
        })
        comment = await tx.comment.update({
          where: { id: params.id },
          data: {
            likes: { increment: 1 },
          },
        })
      })
      liked = true
    }

    return NextResponse.json({ ...(comment as object), liked })
  } catch (error) {
    console.error('Like comment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


