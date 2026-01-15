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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { followingId } = body

    if (!followingId || followingId === user.id) {
      return NextResponse.json(
        { message: 'Invalid following ID' },
        { status: 400 }
      )
    }

    // Check if already following
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: 'Already following' })
    }

    // Create follow relationship
    await prisma.userFollow.create({
      data: {
        followerId: user.id,
        followingId,
      },
    })

    return NextResponse.json({ message: 'Followed successfully' })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const followingId = searchParams.get('userId')

    if (!followingId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId,
        },
      },
    })

    return NextResponse.json({ message: 'Unfollowed successfully' })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


