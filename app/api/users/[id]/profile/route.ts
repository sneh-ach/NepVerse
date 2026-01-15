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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser(request)

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Get follow stats
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: params.id },
      }),
      prisma.userFollow.count({
        where: { followerId: params.id },
      }),
    ])

    // Check if current user is following
    let isFollowing = false
    if (currentUser) {
      const follow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: params.id,
          },
        },
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
      },
      followersCount,
      followingCount,
      isFollowing,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


