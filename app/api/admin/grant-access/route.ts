import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/grant-access
 * Grant admin access to a user (admin only)
 * 
 * WARNING: In production, consider removing this endpoint or adding additional security
 * such as requiring multiple admin approvals or a secret key.
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication to grant admin access
    await requireAdmin(request)
    
    const body = await request.json()
    const { userId, email } = body

    if (!userId && !email) {
      return NextResponse.json(
        { message: 'userId or email is required' },
        { status: 400 }
      )
    }

    // Update user to admin
    const user = await prisma.user.update({
      where: userId ? { id: userId } : { email: email },
      data: { role: 'ADMIN' },
    })

    return NextResponse.json({
      message: 'Admin access granted!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    logError(error, 'Grant admin access')
    
    const errorInfo = handleError(error)
    
    // If role field doesn't exist, we need to update the database
    if (error.message?.includes('Unknown arg `role`') || error.code === 'P2025') {
      return NextResponse.json(
        { 
          message: 'Role field not in database. Please run: npx prisma db push',
          code: 'DATABASE_SCHEMA_ERROR'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}


