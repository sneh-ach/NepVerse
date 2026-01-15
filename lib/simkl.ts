// Simkl API Client
// Documentation: https://simkl.docs.apiary.io/

const SIMKL_API_URL = 'https://api.simkl.com'
const SIMKL_CLIENT_ID = process.env.SIMKL_CLIENT_ID || ''

export interface SimklMovie {
  title: string
  year?: number
  ids: {
    simkl?: number
    imdb?: string
    tmdb?: number
  }
  poster?: string
  fanart?: string
  overview?: string
  genres?: string[]
  runtime?: number
  rating?: {
    simkl?: {
      rating?: number
    }
  }
}

export interface SimklShow {
  title: string
  year?: number
  ids: {
    simkl?: number
    tvdb?: number
    imdb?: string
  }
  poster?: string
  fanart?: string
  overview?: string
  genres?: string[]
  total_episodes?: number
  rating?: {
    simkl?: {
      rating?: number
    }
  }
}

export interface SimklSearchResult {
  movies?: SimklMovie[]
  shows?: SimklShow[]
}

class SimklClient {
  private clientId: string
  private baseUrl: string

  constructor() {
    this.clientId = SIMKL_CLIENT_ID
    this.baseUrl = SIMKL_API_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'simkl-api-key': this.clientId,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`Simkl API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('Simkl API request failed:', error)
      throw error
    }
  }

  // Search for movies and shows
  async search(query: string, type: 'movie' | 'show' | 'all' = 'all'): Promise<any> {
    try {
      const endpoint = `/search/${type}?q=${encodeURIComponent(query)}&extended=full`
      const response = await this.request<any>(endpoint)
      
      // Simkl returns array directly for search
      if (Array.isArray(response)) {
        // Separate movies and shows
        const movies = response.filter((item: any) => 
          item.endpoint_type === 'movies' || 
          item.type === 'movie' ||
          (item.url && item.url.includes('/movies/'))
        )
        const shows = response.filter((item: any) => 
          item.endpoint_type === 'shows' || 
          item.type === 'show' ||
          (item.url && item.url.includes('/shows/'))
        )
        return { movies: movies || [], shows: shows || [] }
      }
      
      // If response is an object, check for movies/shows properties
      if (response && typeof response === 'object') {
        return {
          movies: response.movies || [],
          shows: response.shows || [],
        }
      }
      
      return { movies: [], shows: [] }
    } catch (error) {
      console.error('Simkl search error:', error)
      return { movies: [], shows: [] }
    }
  }

  // Get movie details
  async getMovie(simklId: number): Promise<SimklMovie> {
    const endpoint = `/movies/${simklId}?extended=full`
    return this.request<SimklMovie>(endpoint)
  }

  // Get show details
  async getShow(simklId: number): Promise<SimklShow> {
    const endpoint = `/shows/${simklId}?extended=full`
    return this.request<SimklShow>(endpoint)
  }

  // Discover movies (trending, popular, etc.)
  async discoverMovies(
    type: 'trending' | 'popular' | 'upcoming' = 'trending',
    page: number = 1,
    limit: number = 20
  ): Promise<SimklMovie[]> {
    try {
      // Simkl might not have 'trending', use 'popular' as fallback
      const endpointType = type === 'trending' ? 'popular' : type
      
      // Try different endpoint formats
      const endpoints = [
        `/movies/${endpointType}?extended=full&page=${page}&limit=${limit}`,
        `/movies/${endpointType}?extended=full`,
        `/movies/${endpointType}`,
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await this.request<any>(endpoint)
          // Simkl returns array directly or wrapped in movies property
          if (Array.isArray(response)) {
            return response
          }
          if (response && response.movies && Array.isArray(response.movies)) {
            return response.movies
          }
          if (response && typeof response === 'object') {
            // Try to find array in response
            for (const key in response) {
              if (Array.isArray(response[key])) {
                return response[key]
              }
            }
            // If it's an object with movie data, try to extract
            if (response.ids || response.title) {
              return [response] // Single movie
            }
          }
        } catch (error: any) {
          // If 404, try next endpoint or return empty
          if (error.message?.includes('404')) {
            continue
          }
          // For other errors, log and continue
          console.log(`Endpoint ${endpoint} failed:`, error.message)
          continue
        }
      }
      
      // If all endpoints fail, return empty array
      return []
    } catch (error) {
      console.error('Discover movies error:', error)
      return []
    }
  }

  // Discover shows (trending, popular, etc.)
  async discoverShows(
    type: 'trending' | 'popular' = 'trending',
    page: number = 1,
    limit: number = 20
  ): Promise<SimklShow[]> {
    try {
      // Simkl might not have 'trending', use 'popular' as fallback
      const endpointType = type === 'trending' ? 'popular' : type
      
      // Try different endpoint formats
      const endpoints = [
        `/shows/${endpointType}?extended=full&page=${page}&limit=${limit}`,
        `/shows/${endpointType}?extended=full`,
        `/shows/${endpointType}`,
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await this.request<any>(endpoint)
          // Simkl returns array directly or wrapped in shows property
          if (Array.isArray(response)) {
            return response
          }
          if (response && response.shows && Array.isArray(response.shows)) {
            return response.shows
          }
          if (response && typeof response === 'object') {
            // Try to find array in response
            for (const key in response) {
              if (Array.isArray(response[key])) {
                return response[key]
              }
            }
            // If it's an object with show data, try to extract
            if (response.ids || response.title) {
              return [response] // Single show
            }
          }
        } catch (error: any) {
          // If 404, try next endpoint or return empty
          if (error.message?.includes('404')) {
            continue
          }
          // For other errors, log and continue
          console.log(`Endpoint ${endpoint} failed:`, error.message)
          continue
        }
      }
      
      // If all endpoints fail, return empty array
      return []
    } catch (error) {
      console.error('Discover shows error:', error)
      return []
    }
  }

  // Get custom list by list ID
  async getListById(listId: number): Promise<any> {
    // Try different endpoint formats for list ID
    const endpoints = [
      `/lists/${listId}?extended=full`,
      `/users/5743957/lists/${listId}?extended=full`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request<any>(endpoint)
        if (response) {
          return response
        }
      } catch (error: any) {
        // If 404, try next endpoint
        if (error.message?.includes('404')) {
          continue
        }
        console.log(`List endpoint ${endpoint} failed:`, error.message)
      }
    }

    throw new Error(`Could not find list with ID: ${listId}`)
  }

  // Get custom list by username and list name
  async getCustomList(username: string, listName: string): Promise<any> {
    // Try different endpoint formats
    const endpoints = [
      `/users/${username}/lists/${encodeURIComponent(listName)}?extended=full`,
      `/users/${username}/lists?extended=full`,
      `/lists/${username}/${encodeURIComponent(listName)}?extended=full`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request<any>(endpoint)
        if (response && (response.movies || response.shows || Array.isArray(response))) {
          return response
        }
      } catch (error) {
        // Try next endpoint
        continue
      }
    }

    throw new Error(`Could not find list: ${listName} by user: ${username}`)
  }

  // Search for lists by user
  async getUserLists(username: string): Promise<any> {
    const endpoint = `/users/${username}/lists?extended=full`
    return this.request<any>(endpoint)
  }

  // Get popular Nepali movies using keyword search (no hardcoded titles)
  async getPopularNepaliMovies(): Promise<SimklMovie[]> {
    try {
      // Try to get the list by ID first (if API supports it)
      const list = await this.getListById(14933)
      
      // Handle different response formats
      let movies: any[] = []
      
      if (Array.isArray(list)) {
        movies = list.filter((item: any) => 
          item.endpoint_type === 'movies' || 
          item.type === 'movie' ||
          (item.url && item.url.includes('/movies/'))
        )
      } else if (list.movies && Array.isArray(list.movies)) {
        movies = list.movies
      } else if (list.items && Array.isArray(list.items)) {
        movies = list.items.filter((item: any) => 
          item.endpoint_type === 'movies' || 
          item.type === 'movie' ||
          (item.url && item.url.includes('/movies/'))
        )
      } else if (list && typeof list === 'object') {
        // Try to find movies in any property
        for (const key in list) {
          if (Array.isArray(list[key])) {
            const items = list[key].filter((item: any) => 
              item.endpoint_type === 'movies' || 
              item.type === 'movie' ||
              (item.url && item.url.includes('/movies/'))
            )
            if (items.length > 0) {
              movies = items
              break
            }
          }
        }
      }

      if (movies.length > 0) {
        return movies
      }
    } catch (error) {
      // List API not available, fall through to keyword search
      console.log('List API not available, using keyword search')
    }
    
    // Use keyword-based search instead of hardcoded titles
    try {
      const searchResults = await this.search('Popular Nepali Movies', 'movie')
      const movies = searchResults.movies || []
      
      // If that doesn't return enough, try additional keywords
      if (movies.length < 10) {
        const additionalSearches = await Promise.allSettled([
          this.search('nepali movie', 'movie'),
          this.search('nepal movie', 'movie'),
          this.search('nepali film', 'movie'),
        ])
        
        const seenIds = new Set<string>()
        movies.forEach((m: any) => {
          const id = m.ids?.simkl?.toString() || m.ids?.simkl_id?.toString() || ''
          if (id) seenIds.add(id)
        })
        
        additionalSearches.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.movies) {
            result.value.movies.forEach((movie: any) => {
              const id = movie.ids?.simkl?.toString() || movie.ids?.simkl_id?.toString() || ''
              if (id && !seenIds.has(id)) {
                seenIds.add(id)
                movies.push(movie)
              }
            })
          }
        })
      }
      
      return movies
    } catch (error) {
      console.error('Keyword search failed:', error)
      return []
    }
  }

  // Search for Nepali content specifically
  async searchNepali(query: string = 'nepal'): Promise<SimklSearchResult> {
    // Search with Nepal/Nepali keywords
    const results = await this.search(query, 'all')
    return results
  }

  // Get trending Nepali content
  async getTrendingNepali(): Promise<{ movies: SimklMovie[]; shows: SimklShow[] }> {
    // Search for popular Nepali movies and shows
    const [movies, shows] = await Promise.all([
      this.search('nepal movie', 'movie'),
      this.search('nepal show', 'show'),
    ])

    return {
      movies: movies.movies || [],
      shows: shows.shows || [],
    }
  }
}

// Helper function to format Simkl image URL
export function getSimklImageUrl(imagePath: string, type: 'poster' | 'fanart' | 'episode' = 'poster', size: string = '_c'): string {
  if (!imagePath) return ''
  
  const baseUrl = 'https://wsrv.nl/?url=https://simkl.in'
  const prefix = type === 'poster' ? '/posters/' : type === 'fanart' ? '/fanart/' : '/episodes/'
  
  return `${baseUrl}${prefix}${imagePath}${size}.jpg`
}

// Helper to convert Simkl movie to our format
export function convertSimklMovieToApp(movie: any) {
  const simklId = movie.ids?.simkl_id || movie.ids?.simkl || movie.simkl_id
  const tmdbId = movie.ids?.tmdb || movie.tmdb
  const poster = movie.poster || movie.posterUrl
  const fanart = movie.fanart || movie.fanartUrl
  
  return {
    id: simklId?.toString() || tmdbId?.toString() || '',
    title: movie.title || '',
    titleNepali: movie.title || '', // Simkl might not have Nepali titles
    description: movie.overview || movie.description || '',
    posterUrl: poster ? getSimklImageUrl(poster, 'poster', '_c') : '',
    backdropUrl: fanart ? getSimklImageUrl(fanart, 'fanart', '_medium') : '',
    releaseDate: movie.year ? `${movie.year}-01-01` : new Date().toISOString(),
    duration: movie.runtime || 120,
    rating: movie.ratings?.simkl?.rating || movie.rating?.simkl?.rating || 0,
    ageRating: 'PG-13',
    genres: movie.genres || [],
    isPublished: true,
    isFeatured: false,
    viewCount: 0,
    videoUrl: '', // Would need to get from another source
  }
}

// Helper to convert Simkl show to our format
export function convertSimklShowToApp(show: any) {
  const simklId = show.ids?.simkl_id || show.ids?.simkl || show.simkl_id
  const tvdbId = show.ids?.tvdb || show.tvdb
  const poster = show.poster || show.posterUrl
  const fanart = show.fanart || show.fanartUrl
  
  return {
    id: simklId?.toString() || tvdbId?.toString() || '',
    title: show.title || '',
    titleNepali: show.title || '',
    description: show.overview || show.description || '',
    posterUrl: poster ? getSimklImageUrl(poster, 'poster', '_c') : '',
    backdropUrl: fanart ? getSimklImageUrl(fanart, 'fanart', '_medium') : '',
    releaseDate: show.year ? `${show.year}-01-01` : new Date().toISOString(),
    rating: show.ratings?.simkl?.rating || show.rating?.simkl?.rating || 0,
    ageRating: 'PG-13',
    genres: show.genres || [],
    isPublished: true,
    isFeatured: false,
    viewCount: 0,
    episodeCount: show.total_episodes || 0,
  }
}

export const simklClient = new SimklClient()
