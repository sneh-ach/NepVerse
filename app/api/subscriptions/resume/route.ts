import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        cancelAtPeriodEnd: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { message: 'No subscription to resume' },
        { status: 404 }
      )
    }

    // Resume subscription
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Resume subscription error:', error)
    return NextResponse.json(
      { message: 'Failed to resume subscription' },
      { status: 500 }
    )
  }
}




