import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import { join } from 'path'

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
    
    // Convert IMDB data to app format
    const movies = imdbMovies.map((imdbMovie) => ({
      id: imdbMovie.imdb_id || `imdb-${imdbMovie.imdb_id}`,
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
    }))
    
    // Filter and sort movies
    const filteredMovies = movies
      .filter((movie) => movie.title) // Remove empty titles
      .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating
    
    return NextResponse.json({
      movies: filteredMovies,
      count: filteredMovies.length,
      source: 'imdb_crawler',
      cached: !refresh && imdbMovies.length > 0,
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




