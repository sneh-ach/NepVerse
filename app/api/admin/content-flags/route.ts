import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { handleError, logError } from '@/lib/errorHandler'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as any

    const flags = await prisma.contentFlag.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      include: {
        user: {
          select: { email: true },
        },
        movie: {
          select: { id: true, title: true },
        },
        series: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(flags)
  } catch (error) {
    logError(error, 'Get content flags')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message },
      { status: errorInfo.statusCode }
    )
  }
}


