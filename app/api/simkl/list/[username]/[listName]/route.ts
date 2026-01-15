import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string; listName: string } }
) {
  try {
    const username = decodeURIComponent(params.username)
    const listName = decodeURIComponent(params.listName)

    const list = await simklClient.getCustomList(username, listName)
    
    // Handle different response formats
    let movies: any[] = []
    let shows: any[] = []

    if (Array.isArray(list)) {
      movies = list.filter((item: any) => item.endpoint_type === 'movies' || item.type === 'movie')
      shows = list.filter((item: any) => item.endpoint_type === 'shows' || item.type === 'show')
    } else if (list.movies) {
      movies = Array.isArray(list.movies) ? list.movies : []
    } else if (list.shows) {
      shows = Array.isArray(list.shows) ? list.shows : []
    } else if (list.items) {
      movies = list.items.filter((item: any) => item.endpoint_type === 'movies' || item.type === 'movie')
      shows = list.items.filter((item: any) => item.endpoint_type === 'shows' || item.type === 'show')
    }

    // Convert to app format
    const convertedMovies = movies.map(convertSimklMovieToApp)
    const convertedShows = shows.map(convertSimklShowToApp)

    return NextResponse.json({
      movies: convertedMovies,
      shows: convertedShows,
      count: convertedMovies.length + convertedShows.length,
    })
  } catch (error: any) {
    console.error('Get custom list error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch custom list',
        movies: [],
        shows: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}




