import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateSecureToken } from '@/lib/security'

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

    // Check if user already has a referral code
    const existing = await prisma.referral.findFirst({
      where: { referrerId: user.id },
    })

    if (existing) {
      return NextResponse.json({
        referralCode: existing.referralCode,
        referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${existing.referralCode}`,
      })
    }

    // Generate unique referral code
    let referralCode: string
    let isUnique = false

    while (!isUnique) {
      referralCode = `REF${generateSecureToken(6).toUpperCase().slice(0, 6)}`
      const exists = await prisma.referral.findUnique({
        where: { referralCode },
      })
      if (!exists) {
        isUnique = true
      }
    }

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: user.id,
        referralCode: referralCode!,
      },
    })

    return NextResponse.json({
      referralCode: referral.referralCode,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referral.referralCode}`,
    })
  } catch (error) {
    console.error('Generate referral error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


