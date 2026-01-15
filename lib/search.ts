// Advanced search service
// Supports Elasticsearch and Algolia
// Falls back to database search if neither is configured

import { prisma } from './prisma'

export interface SearchOptions {
  query: string
  filters?: {
    type?: 'movie' | 'series' | 'all'
    genre?: string[]
    year?: { min?: number; max?: number }
    rating?: { min?: number; max?: number }
    actor?: string
    director?: string
  }
  sort?: 'relevance' | 'rating' | 'year' | 'popularity'
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  type: 'movie' | 'series'
  title: string
  titleNepali?: string
  description: string
  posterUrl: string
  rating?: number
  year?: number
  genres?: string[]
  relevance?: number
}

class SearchService {
  private elasticsearchUrl: string | null = null
  private algoliaAppId: string | null = null
  private algoliaApiKey: string | null = null
  private algoliaIndexName: string | null = null

  constructor() {
    this.elasticsearchUrl = process.env.ELASTICSEARCH_URL || null
    this.algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || null
    this.algoliaApiKey = process.env.ALGOLIA_API_KEY || null
    this.algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || 'nepverse_content'
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    // Try Algolia first
    if (this.algoliaAppId && this.algoliaApiKey) {
      return this.searchAlgolia(options)
    }

    // Try Elasticsearch
    if (this.elasticsearchUrl) {
      return this.searchElasticsearch(options)
    }

    // Fallback to database search
    return this.searchDatabase(options)
  }

  private async searchAlgolia(options: SearchOptions): Promise<SearchResult[]> {
    try {
      // Dynamic import to avoid SSR issues
      const algoliasearchModule = await import('algoliasearch')
      const algoliasearch = ('default' in algoliasearchModule ? algoliasearchModule.default : algoliasearchModule) as any
      const client = algoliasearch(this.algoliaAppId!, this.algoliaApiKey!)
      const index = client.initIndex(this.algoliaIndexName!)

      const searchParams: any = {
        hitsPerPage: options.limit || 20,
        page: Math.floor((options.offset || 0) / (options.limit || 20)),
      }

      // Add filters
      if (options.filters) {
        const filters: string[] = []
        if (options.filters.type && options.filters.type !== 'all') {
          filters.push(`type:${options.filters.type}`)
        }
        if (options.filters.genre && options.filters.genre.length > 0) {
          filters.push(`genres:${options.filters.genre.join(' OR ')}`)
        }
        if (options.filters.year) {
          if (options.filters.year.min) {
            filters.push(`year >= ${options.filters.year.min}`)
          }
          if (options.filters.year.max) {
            filters.push(`year <= ${options.filters.year.max}`)
          }
        }
        if (filters.length > 0) {
          searchParams.filters = filters.join(' AND ')
        }
      }

      const result = await index.search(options.query, searchParams)
      return result.hits.map((hit: any) => ({
        id: hit.objectID,
        type: hit.type,
        title: hit.title,
        titleNepali: hit.titleNepali,
        description: hit.description,
        posterUrl: hit.posterUrl,
        rating: hit.rating,
        year: hit.year,
        genres: hit.genres,
        relevance: hit._rankingInfo?.userScore,
      }))
    } catch (error) {
      console.error('Algolia search error:', error)
      return this.searchDatabase(options)
    }
  }

  private async searchElasticsearch(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const query: any = {
        bool: {
          must: [
            {
              multi_match: {
                query: options.query,
                fields: ['title^3', 'titleNepali^2', 'description'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      }

      if (options.filters) {
        if (options.filters.type && options.filters.type !== 'all') {
          query.bool.must.push({ term: { type: options.filters.type } })
        }
        if (options.filters.genre && options.filters.genre.length > 0) {
          query.bool.must.push({ terms: { genres: options.filters.genre } })
        }
        if (options.filters.year) {
          const range: any = {}
          if (options.filters.year.min) range.gte = options.filters.year.min
          if (options.filters.year.max) range.lte = options.filters.year.max
          query.bool.must.push({ range: { year: range } })
        }
      }

      const response = await fetch(`${this.elasticsearchUrl}/nepverse_content/_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          size: options.limit || 20,
          from: options.offset || 0,
          sort: this.getSortOptions(options.sort),
        }),
      })

      const data = await response.json()
      return data.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: hit._source.type,
        title: hit._source.title,
        titleNepali: hit._source.titleNepali,
        description: hit._source.description,
        posterUrl: hit._source.posterUrl,
        rating: hit._source.rating,
        year: hit._source.year,
        genres: hit._source.genres,
        relevance: hit._score,
      }))
    } catch (error) {
      console.error('Elasticsearch search error:', error)
      return this.searchDatabase(options)
    }
  }

  private async searchDatabase(options: SearchOptions): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { title: { contains: options.query, mode: 'insensitive' } },
        { titleNepali: { contains: options.query, mode: 'insensitive' } },
        { description: { contains: options.query, mode: 'insensitive' } },
      ],
      isPublished: true,
    }

    if (options.filters?.type && options.filters.type !== 'all') {
      // This will be handled separately for movies and series
    }

    const movies = await prisma.movie.findMany({
      where: options.filters?.type === 'series' ? { id: 'never' } : where,
      take: options.limit || 20,
      skip: options.offset || 0,
      include: { genres: true },
      orderBy: this.getDatabaseSort(options.sort),
    })

    const series = await prisma.series.findMany({
      where: options.filters?.type === 'movie' ? { id: 'never' } : where,
      take: options.limit || 20,
      skip: options.offset || 0,
      include: { genres: true },
      orderBy: this.getDatabaseSort(options.sort),
    })

    const results: SearchResult[] = [
      ...movies.map((m) => ({
        id: m.id,
        type: 'movie' as const,
        title: m.title,
        titleNepali: m.titleNepali || undefined,
        description: m.description,
        posterUrl: m.posterUrl,
        rating: m.rating || undefined,
        year: m.releaseDate.getFullYear(),
        genres: m.genres.map((g) => g.name),
      })),
      ...series.map((s) => ({
        id: s.id,
        type: 'series' as const,
        title: s.title,
        titleNepali: s.titleNepali || undefined,
        description: s.description,
        posterUrl: s.posterUrl,
        rating: s.rating || undefined,
        year: s.releaseDate.getFullYear(),
        genres: s.genres.map((g) => g.name),
      })),
    ]

    return results.slice(0, options.limit || 20)
  }

  private getSortOptions(sort?: string): any[] {
    switch (sort) {
      case 'rating':
        return [{ rating: { order: 'desc' } }]
      case 'year':
        return [{ year: { order: 'desc' } }]
      case 'popularity':
        return [{ viewCount: { order: 'desc' } }]
      default:
        return [{ _score: { order: 'desc' } }]
    }
  }

  private getDatabaseSort(sort?: string): any {
    switch (sort) {
      case 'rating':
        return { rating: 'desc' }
      case 'year':
        return { releaseDate: 'desc' }
      case 'popularity':
        return { viewCount: 'desc' }
      default:
        return { createdAt: 'desc' }
    }
  }

  // Get search suggestions/autocomplete
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (this.algoliaAppId && this.algoliaApiKey) {
      try {
        const algoliasearchModule = await import('algoliasearch')
      const algoliasearch = ('default' in algoliasearchModule ? algoliasearchModule.default : algoliasearchModule) as any
        const client = algoliasearch(this.algoliaAppId!, this.algoliaApiKey!)
        const index = client.initIndex(this.algoliaIndexName!)

        const result = await index.search(query, {
          hitsPerPage: limit,
          attributesToRetrieve: ['title'],
        })

        return result.hits.map((hit: any) => hit.title)
      } catch (error) {
        console.error('Algolia suggestions error:', error)
      }
    }

    // Fallback to database
    const movies = await prisma.movie.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
        isPublished: true,
      },
      take: limit,
      select: { title: true },
    })

    return movies.map((m) => m.title)
  }
}

export const searchService = new SearchService()


