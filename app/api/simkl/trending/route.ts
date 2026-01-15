import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // movie, show, or all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let movies: any[] = []
    let shows: any[] = []

    if (type === 'movie' || type === 'all') {
      try {
        movies = await simklClient.discoverMovies('popular', page, limit) // Use 'popular' instead of 'trending'
        if (movies.length === 0) {
          // Fallback: try search
          const searchResults = await simklClient.search('movie', 'movie')
          movies = searchResults.movies || []
        }
      } catch (error) {
        console.error('Error fetching movies:', error)
      }
    }

    if (type === 'show' || type === 'all') {
      try {
        shows = await simklClient.discoverShows('popular', page, limit) // Use 'popular' instead of 'trending'
        if (shows.length === 0) {
          // Fallback: try search
          const searchResults = await simklClient.search('show', 'show')
          shows = searchResults.shows || []
        }
      } catch (error) {
        console.error('Error fetching shows:', error)
      }
    }

    const convertedMovies = movies.map(convertSimklMovieToApp).filter(m => m.title)
    const convertedShows = shows.map(convertSimklShowToApp).filter(s => s.title)

    if (type === 'movie') {
      return NextResponse.json({ movies: convertedMovies })
    } else if (type === 'show') {
      return NextResponse.json({ shows: convertedShows })
    } else {
      return NextResponse.json({
        movies: convertedMovies,
        shows: convertedShows,
      })
    }
  } catch (error: any) {
    console.error('Simkl trending error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch trending content',
        movies: [],
        shows: [],
      },
      { status: 500 }
    )
  }
}

