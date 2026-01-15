import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    const promoCodes = await prisma.promoCode.findMany({
      include: {
        redemptions: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(promoCodes)
  } catch (error) {
    logError(error, 'Get promo codes')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    const body = await request.json()
    const {
      code,
      discount,
      discountType,
      maxUses,
      validFrom,
      validUntil,
    } = body

    if (!code || !discount || !validFrom || !validUntil) {
      return NextResponse.json(
        { message: 'Code, discount, and validity dates are required' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        discountType: discountType || 'PERCENTAGE',
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    })

    return NextResponse.json(promoCode)
  } catch (error) {
    logError(error, 'Create promo code')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


