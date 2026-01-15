import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin(request)
    const body = await request.json()
    const { status } = body

    if (!status || !['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }
    
    const flag = await prisma.contentFlag.update({
      where: { id: params.id },
      data: {
        status: status as any,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json(flag)
  } catch (error) {
    logError(error, 'Update content flag')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


