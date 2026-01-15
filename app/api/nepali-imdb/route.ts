import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { simklClient, convertSimklMovieToApp } from '@/lib/simkl'

const execAsync = promisify(exec)

interface IMDBMovie {
  imdb_id: string
  title: string
  year?: number
  rating?: number
  runtime?: number
  genres?: string[]
  description?: string
  poster_url?: string
  imdb_url?: string
}

/**
 * Get Nepali movies from IMDB crawler and enrich with Simkl/TMDB data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    
    const dataPath = join(process.cwd(), 'scripts', 'nepali_movies_imdb.json')
    
    let imdbMovies: IMDBMovie[] = []
    
    // Try to read cached data first (unless refresh requested)
    if (!refresh) {
      try {
        const cachedData = await readFile(dataPath, 'utf-8')
        imdbMovies = JSON.parse(cachedData)
        console.log(`Loaded ${imdbMovies.length} movies from cache`)
      } catch (error) {
        console.log('No cached data found, will run crawler')
      }
    }
    
    // If no cached data or refresh requested, run crawler
    if (imdbMovies.length === 0 || refresh) {
      try {
        console.log('Running IMDB crawler...')
        const scriptsPath = join(process.cwd(), 'scripts')
        const { stdout, stderr } = await execAsync(
          `cd ${scriptsPath} && python3 nepali_imdb_crawler.py`,
          { timeout: 300000 } // 5 minute timeout
        )
        
        if (stderr && !stderr.includes('Warning')) {
          console.error('Crawler stderr:', stderr)
        }
        
        // Read the generated file
        const crawlerData = await readFile(dataPath, 'utf-8')
        imdbMovies = JSON.parse(crawlerData)
        console.log(`Crawler found ${imdbMovies.length} movies`)
      } catch (error: any) {
        console.error('Crawler error:', error)
        // If crawler fails, try to use cached data
        if (imdbMovies.length === 0) {
          return NextResponse.json(
            { 
              message: 'Crawler failed and no cached data available',
              movies: [],
              count: 0,
            },
            { status: 500 }
          )
        }
      }
    }
    
    // Enrich IMDB data with Simkl/TMDB data (for posters, better metadata)
    const enrichedMovies = await Promise.allSettled(
      imdbMovies.map(async (imdbMovie) => {
        try {
          // Try to find in Simkl by IMDB ID
          let simklData = null
          
          if (imdbMovie.imdb_id) {
            // Search Simkl for this movie
            const searchResults = await simklClient.search(imdbMovie.title, 'movie')
            const matchingMovie = searchResults.movies?.find((m: any) => {
              const simklImdb = m.ids?.imdb || ''
              return simklImdb === imdbMovie.imdb_id || 
                     simklImdb === `tt${imdbMovie.imdb_id}` ||
                     simklImdb.replace('tt', '') === imdbMovie.imdb_id.replace('tt', '')
            })
            
            if (matchingMovie) {
              simklData = matchingMovie
            }
          }
          
          // If no Simkl match, search by title
          if (!simklData) {
            const searchResults = await simklClient.search(imdbMovie.title, 'movie')
            if (searchResults.movies && searchResults.movies.length > 0) {
              // Find best match by title similarity
              const bestMatch = searchResults.movies.find((m: any) => {
                const simklTitle = (m.title || '').toLowerCase()
                const imdbTitle = (imdbMovie.title || '').toLowerCase()
                return simklTitle === imdbTitle || 
                       simklTitle.includes(imdbTitle) ||
                       imdbTitle.includes(simklTitle)
              })
              simklData = bestMatch || searchResults.movies[0]
            }
          }
          
          // Convert Simkl data to app format
          const appMovie = simklData ? convertSimklMovieToApp(simklData) : null
          
          // Merge IMDB and Simkl data (IMDB takes priority for some fields)
          return {
            id: imdbMovie.imdb_id || appMovie?.id || `imdb-${imdbMovie.imdb_id}`,
            title: imdbMovie.title,
            year: imdbMovie.year || appMovie?.year,
            rating: imdbMovie.rating || appMovie?.rating,
            runtime: imdbMovie.runtime || appMovie?.duration,
            genres: imdbMovie.genres || appMovie?.genres || [],
            description: imdbMovie.description || appMovie?.description || '',
            posterUrl: appMovie?.posterUrl || imdbMovie.poster_url || '',
            backdropUrl: appMovie?.backdropUrl || '',
            imdbId: imdbMovie.imdb_id,
            imdbUrl: imdbMovie.imdb_url,
            source: 'imdb_crawler',
            simklEnriched: !!simklData,
          }
        } catch (error) {
          console.error(`Error enriching movie ${imdbMovie.title}:`, error)
          // Return basic IMDB data if enrichment fails
          return {
            id: imdbMovie.imdb_id || `imdb-${Date.now()}`,
            title: imdbMovie.title,
            year: imdbMovie.year,
            rating: imdbMovie.rating,
            runtime: imdbMovie.runtime,
            genres: imdbMovie.genres || [],
            description: imdbMovie.description || '',
            posterUrl: imdbMovie.poster_url || '',
            backdropUrl: '',
            imdbId: imdbMovie.imdb_id,
            imdbUrl: imdbMovie.imdb_url,
            source: 'imdb_crawler',
            simklEnriched: false,
          }
        }
      })
    )
    
    // Filter successful results
    const movies = enrichedMovies
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value)
      .filter((movie) => movie.title) // Remove empty titles
      .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating
    
    return NextResponse.json({
      movies,
      count: movies.length,
      source: 'imdb_crawler',
      cached: !refresh && imdbMovies.length > 0,
      enriched: movies.filter(m => m.simklEnriched).length,
    })
  } catch (error: any) {
    console.error('IMDB crawler API error:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Failed to fetch Nepali movies from IMDB',
        movies: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}




