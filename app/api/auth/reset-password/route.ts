import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validate, passwordResetConfirmSchema } from '@/lib/validation'
import { hashToken, verifyToken as verifyTokenHash, isStrongPassword } from '@/lib/security'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = validate(passwordResetConfirmSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Validate password strength
    const passwordCheck = isStrongPassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { message: passwordCheck.message || 'Password does not meet requirements' },
        { status: 400 }
      )
    }

    // Verify token from database
    const resetToken = await db.user.verifyPasswordResetToken(token)
    
    if (!resetToken) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    
    // Use transaction to ensure atomicity (update password + mark token as used)
    await prisma.$transaction(async (tx) => {
      // Update password
      await db.user.updatePassword(resetToken.userId, password)
      
      // Mark token as used
      await db.user.markPasswordResetTokenUsed(resetToken.id)
    })

    return NextResponse.json({
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Password reset confirm error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

