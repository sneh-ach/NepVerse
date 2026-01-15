import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.watchParty.findUnique({
      where: { partyCode: params.id },
      include: {
        host: {
          include: { profile: true },
        },
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    })

    if (!party) {
      return NextResponse.json(
        { message: 'Watch party not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (party.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Watch party has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json(party)
  } catch (error) {
    console.error('Get watch party error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.watchParty.findUnique({
      where: { partyCode: params.id },
    })

    if (!party) {
      return NextResponse.json(
        { message: 'Watch party not found' },
        { status: 404 }
      )
    }

    if (party.hostId !== user.id) {
      return NextResponse.json(
        { message: 'Only the host can delete the party' },
        { status: 403 }
      )
    }

    await prisma.watchParty.delete({
      where: { id: party.id },
    })

    return NextResponse.json({ message: 'Watch party deleted' })
  } catch (error) {
    console.error('Delete watch party error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


