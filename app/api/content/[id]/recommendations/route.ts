import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/lib/recommendations'
import { cacheService } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contentType = searchParams.get('type') as 'movie' | 'series'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contentType) {
      return NextResponse.json(
        { message: 'Content type is required' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `recommendations:${contentType}:${params.id}:${limit}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const recommendations = await recommendationService.getBecauseYouWatched(
      params.id,
      contentType,
      limit
    )

    // Cache for 1 hour
    await cacheService.set(cacheKey, recommendations, { ttl: 3600 })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Content recommendations error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


