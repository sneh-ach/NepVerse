import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(request: NextRequest) {
  try {
    // Get the specific list by ID (14933 - Indian Based Titles Popular Nepali Movies)
    const list = await simklClient.getListById(14933)
    
    // Handle different response formats
    let movies: any[] = []
    let shows: any[] = []

    if (Array.isArray(list)) {
      movies = list.filter((item: any) => 
        item.endpoint_type === 'movies' || 
        item.type === 'movie' ||
        (item.url && item.url.includes('/movies/'))
      )
      shows = list.filter((item: any) => 
        item.endpoint_type === 'shows' || 
        item.type === 'show' ||
        (item.url && item.url.includes('/shows/'))
      )
    } else if (list.movies && Array.isArray(list.movies)) {
      movies = list.movies
    } else if (list.shows && Array.isArray(list.shows)) {
      shows = list.shows
    } else if (list.items && Array.isArray(list.items)) {
      movies = list.items.filter((item: any) => 
        item.endpoint_type === 'movies' || 
        item.type === 'movie' ||
        (item.url && item.url.includes('/movies/'))
      )
      shows = list.items.filter((item: any) => 
        item.endpoint_type === 'shows' || 
        item.type === 'show' ||
        (item.url && item.url.includes('/shows/'))
      )
    } else if (list && typeof list === 'object') {
      // Try to find movies/shows in any property
      for (const key in list) {
        if (Array.isArray(list[key])) {
          const items = list[key]
          movies.push(...items.filter((item: any) => 
            item.endpoint_type === 'movies' || 
            item.type === 'movie' ||
            (item.url && item.url.includes('/movies/'))
          ))
          shows.push(...items.filter((item: any) => 
            item.endpoint_type === 'shows' || 
            item.type === 'show' ||
            (item.url && item.url.includes('/shows/'))
          ))
        }
      }
    }

    // Convert to app format
    const convertedMovies = movies.map(convertSimklMovieToApp).filter(m => m.title)
    const convertedShows = shows.map(convertSimklShowToApp).filter(s => s.title)

    return NextResponse.json({
      movies: convertedMovies,
      shows: convertedShows,
      count: convertedMovies.length + convertedShows.length,
      source: 'list_14933',
    })
  } catch (error: any) {
    console.error('Get list 14933 error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch list',
        movies: [],
        shows: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}




