import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = (searchParams.get('type') as 'movie' | 'show' | 'all') || 'all'

    if (!query) {
      return NextResponse.json(
        { message: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await simklClient.search(query, type)
    
    // Ensure we have arrays
    const movies = Array.isArray(results.movies) ? results.movies : []
    const shows = Array.isArray(results.shows) ? results.shows : []
    
    // Convert to app format
    const converted = {
      movies: movies.map(convertSimklMovieToApp).filter(m => m.title),
      shows: shows.map(convertSimklShowToApp).filter(s => s.title),
    }
    
    return NextResponse.json(converted)
  } catch (error: any) {
    console.error('Simkl search error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to search Simkl',
        movies: [],
        shows: [],
      },
      { status: 500 }
    )
  }
}

