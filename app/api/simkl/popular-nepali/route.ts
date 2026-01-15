import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp } from '@/lib/simkl'

/**
 * Get popular Nepali movies using keyword-based search
 * No hardcoded movie titles - uses search keywords instead
 */
export async function GET(request: NextRequest) {
  try {
    // Use keyword-based searches instead of hardcoded movie titles
    // This is more maintainable and will find new movies automatically
    const searchKeywords = [
      'Popular Nepali Movies',
      'nepali movie',
      'nepal movie',
      'nepali film',
      'nepal film',
      'nepali cinema',
      'nepal cinema',
      'kathmandu movie',
      'nepal',
      'nepali',
    ]

    const allMovies: any[] = []
    const seenIds = new Set<string>()

    // Search for each keyword and aggregate results
    const searchPromises = searchKeywords.map(async (keyword) => {
      try {
        const results = await simklClient.search(keyword, 'movie')
        return results.movies || []
      } catch (error) {
        console.error(`Search failed for "${keyword}":`, error)
        return []
      }
    })

    // Wait for all searches to complete
    const searchResults = await Promise.allSettled(searchPromises)
    
    // Aggregate all results
    searchResults.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        result.value.forEach((movie: any) => {
          const id = 
            movie.ids?.simkl_id?.toString() || 
            movie.ids?.simkl?.toString() || 
            movie.ids?.tmdb?.toString() ||
            movie.simkl_id?.toString() ||
            ''
          
          if (id && !seenIds.has(id) && movie.title) {
            seenIds.add(id)
            allMovies.push(movie)
          }
        })
      }
    })

    // Additional strategy: Filter popular movies for Nepali content
    try {
      const popularMovies = await simklClient.discoverMovies('popular', 1, 100)
      const nepaliKeywords = ['nepal', 'nepali', 'kathmandu']
      
      popularMovies.forEach((movie: any) => {
        if (!movie.title) return
        
        const title = movie.title.toLowerCase()
        const overview = (movie.overview || '').toLowerCase()
        const isNepali = nepaliKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        )
        
        if (isNepali) {
          const id = 
            movie.ids?.simkl_id?.toString() || 
            movie.ids?.simkl?.toString() || 
            movie.ids?.tmdb?.toString() ||
            ''
          
          if (id && !seenIds.has(id)) {
            seenIds.add(id)
            allMovies.push(movie)
          }
        }
      })
    } catch (error) {
      console.error('Popular movies filter failed:', error)
      // Continue without this strategy
    }

    // Convert to app format, sort by rating, and limit results
    const convertedMovies = allMovies
      .map(convertSimklMovieToApp)
      .filter(m => m.title && m.title.trim().length > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 50)

    return NextResponse.json({
      movies: convertedMovies,
      count: convertedMovies.length,
      source: 'keyword_search',
    })
  } catch (error: any) {
    console.error('Get popular Nepali movies error:', error)
    
    // Simple fallback search
    try {
      const searchResults = await simklClient.search('Popular Nepali Movies', 'movie')
      const convertedMovies = (searchResults.movies || [])
        .map(convertSimklMovieToApp)
        .filter(m => m.title)
      
      return NextResponse.json({
        movies: convertedMovies,
        count: convertedMovies.length,
        source: 'fallback',
      })
    } catch (fallbackError: any) {
      return NextResponse.json(
        { 
          message: error.message || 'Failed to fetch popular Nepali movies',
          movies: [],
          count: 0,
          source: 'error',
        },
        { status: 500 }
      )
    }
  }
}
