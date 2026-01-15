import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * POST /api/promo-codes/validate
 * Validate a promo code (public endpoint with rate limiting)
 * 
 * @param body.code - Promo code to validate (required)
 * @returns Validation result with discount information
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public promo code validation
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { message: 'Promo code is required' },
        { status: 400 }
      )
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, message: 'Invalid promo code' },
        { status: 404 }
      )
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { valid: false, message: 'Promo code is not active' },
        { status: 400 }
      )
    }

    // Check validity dates
    const now = new Date()
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return NextResponse.json(
        { valid: false, message: 'Promo code has expired' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { valid: false, message: 'Promo code has reached usage limit' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      discount: promoCode.discount,
      discountType: promoCode.discountType,
    })
  } catch (error) {
    logError(error, 'Validate promo code')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


