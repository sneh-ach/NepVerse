import { NextRequest, NextResponse } from 'next/server'
import { searchService } from '@/lib/search'
import { cacheService } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Check cache
    const cacheKey = `search:suggestions:${query}:${limit}`
    const cached = await cacheService.get<string[]>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const suggestions = await searchService.getSuggestions(query, limit)

    // Cache for 1 hour
    await cacheService.set(cacheKey, suggestions, { ttl: 3600 })

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}


