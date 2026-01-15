import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(request: NextRequest) {
  try {
    // First, try to get from the popular Nepali movies list
    try {
      const popularMovies = await simklClient.getPopularNepaliMovies()
      if (popularMovies && Array.isArray(popularMovies) && popularMovies.length > 0) {
        const convertedMovies = popularMovies.map(convertSimklMovieToApp).filter(m => m.title)
        
        // Also search for shows
        const showResults = await simklClient.search('nepal show', 'show')
        const shows = Array.isArray(showResults.shows) ? showResults.shows : []
        const convertedShows = shows.slice(0, 10).map(convertSimklShowToApp).filter(s => s.title)
        
        return NextResponse.json({
          movies: convertedMovies,
          shows: convertedShows,
          source: 'custom_list',
        })
      }
    } catch (listError) {
      console.log('Custom list not available, falling back to search:', listError)
    }

    // Fallback: Search for Nepali content using keywords (no hardcoded titles)
    const nepaliQueries = [
      'Popular Nepali Movies',
      'nepal movie',
      'nepali movie',
      'nepal film',
      'nepali film',
      'nepali cinema',
      'nepal cinema',
      'kathmandu',
      'nepal',
      'nepali',
    ]
    
    // Try multiple searches and combine results
    const allResults = await Promise.allSettled(
      nepaliQueries.map((query) => simklClient.search(query, 'all'))
    )

    // Combine and deduplicate results
    const allMovies: any[] = []
    const allShows: any[] = []
    const seenMovies = new Set<string | number>()
    const seenShows = new Set<string | number>()

    allResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const movies = Array.isArray(result.value.movies) ? result.value.movies : []
        const shows = Array.isArray(result.value.shows) ? result.value.shows : []
        
        movies.forEach((movie: any) => {
          const id = movie.ids?.simkl_id || movie.ids?.simkl || movie.ids?.tmdb || movie.simkl_id
          if (id && !seenMovies.has(id)) {
            seenMovies.add(id)
            allMovies.push(movie)
          }
        })
        
        shows.forEach((show: any) => {
          const id = show.ids?.simkl_id || show.ids?.simkl || show.ids?.tvdb || show.simkl_id
          if (id && !seenShows.has(id)) {
            seenShows.add(id)
            allShows.push(show)
          }
        })
      }
    })

    // Convert to app format
    const convertedMovies = allMovies.slice(0, 30).map(convertSimklMovieToApp).filter(m => m.title)
    const convertedShows = allShows.slice(0, 20).map(convertSimklShowToApp).filter(s => s.title)

    return NextResponse.json({
      movies: convertedMovies,
      shows: convertedShows,
      source: 'search',
    })
  } catch (error: any) {
    console.error('Simkl Nepali content error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch Nepali content',
        movies: [],
        shows: [],
      },
      { status: 500 }
    )
  }
}

