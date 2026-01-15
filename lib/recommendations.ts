// Recommendation engine
// Supports collaborative filtering, content-based filtering, and ML-based recommendations

import { prisma } from './prisma'

export interface RecommendationOptions {
  userId: string
  limit?: number
  type?: 'movie' | 'series' | 'all'
  algorithm?: 'collaborative' | 'content-based' | 'hybrid' | 'trending'
}

export interface Recommendation {
  id: string
  type: 'movie' | 'series'
  title: string
  posterUrl: string
  rating?: number
  score: number // Recommendation score (0-1)
  reason?: string // Why this was recommended
}

class RecommendationService {
  private mlEndpoint: string | null = null

  constructor() {
    this.mlEndpoint = process.env.ML_RECOMMENDATION_ENDPOINT || null
  }

  async getRecommendations(options: RecommendationOptions): Promise<Recommendation[]> {
    const { userId, limit = 20, type = 'all', algorithm = 'hybrid' } = options

    switch (algorithm) {
      case 'collaborative':
        return this.getCollaborativeRecommendations(userId, limit, type)
      case 'content-based':
        return this.getContentBasedRecommendations(userId, limit, type)
      case 'trending':
        return this.getTrendingRecommendations(limit, type)
      case 'hybrid':
      default:
        return this.getHybridRecommendations(userId, limit, type)
    }
  }

  // Collaborative filtering: Users who watched similar content
  private async getCollaborativeRecommendations(
    userId: string,
    limit: number,
    type: string
  ): Promise<Recommendation[]> {
    // Get user's watch history
    const userHistory = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        movie: { include: { genres: true } },
        series: { include: { genres: true } },
      },
    })

    if (userHistory.length === 0) {
      return this.getTrendingRecommendations(limit, type)
    }

    // Get genres user likes
    const userGenres = new Set<string>()
    userHistory.forEach((h) => {
      if (h.movie) {
        h.movie.genres.forEach((g) => userGenres.add(g.id))
      }
      if (h.series) {
        h.series.genres.forEach((g) => userGenres.add(g.id))
      }
    })

    // Find similar users (users who watched same content)
    const similarUsers = await prisma.watchHistory.findMany({
      where: {
        userId: { not: userId },
        OR: [
          { movieId: { in: userHistory.filter((h) => h.movieId).map((h) => h.movieId!) } },
          { seriesId: { in: userHistory.filter((h) => h.seriesId).map((h) => h.seriesId!) } },
        ],
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Get content watched by similar users but not by current user
    const watchedIds = new Set([
      ...userHistory.filter((h) => h.movieId).map((h) => h.movieId!),
      ...userHistory.filter((h) => h.seriesId).map((h) => h.seriesId!),
    ])

    const recommendations = await prisma.watchHistory.findMany({
      where: {
        userId: { in: similarUsers.map((u) => u.userId) },
        movieId: type !== 'series' ? { notIn: Array.from(watchedIds) } : undefined,
        seriesId: type !== 'movie' ? { notIn: Array.from(watchedIds) } : undefined,
      },
      include: {
        movie: { include: { genres: true } },
        series: { include: { genres: true } },
      },
      take: limit * 2,
    })

    // Score and rank recommendations
    const scored = recommendations.map((r) => {
      const content = r.movie || r.series
      if (!content) return null

      let score = 0.5
      // Boost score if genres match
      const contentGenres = new Set(
        (r.movie?.genres || r.series?.genres || []).map((g) => g.id)
      )
      const matchingGenres = Array.from(userGenres).filter((g) => contentGenres.has(g)).length
      score += matchingGenres * 0.1

      return {
        id: content.id,
        type: r.movie ? ('movie' as const) : ('series' as const),
        title: content.title,
        posterUrl: content.posterUrl,
        rating: content.rating || undefined,
        score: Math.min(1, score),
        reason: 'Users with similar taste also watched this',
      }
    })

    return scored.filter((r): r is Recommendation => r !== null).slice(0, limit)
  }

  // Content-based filtering: Similar content based on metadata
  private async getContentBasedRecommendations(
    userId: string,
    limit: number,
    type: string
  ): Promise<Recommendation[]> {
    const userHistory = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        movie: { include: { genres: true } },
        series: { include: { genres: true } },
      },
    })

    if (userHistory.length === 0) {
      return this.getTrendingRecommendations(limit, type)
    }

    // Get user's preferred genres
    const genreCounts = new Map<string, number>()
    userHistory.forEach((h) => {
      const genres = h.movie?.genres || h.series?.genres || []
      genres.forEach((g) => {
        genreCounts.set(g.id, (genreCounts.get(g.id) || 0) + 1)
      })
    })

    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)

    // Get watched IDs
    const watchedIds = new Set([
      ...userHistory.filter((h) => h.movieId).map((h) => h.movieId!),
      ...userHistory.filter((h) => h.seriesId).map((h) => h.seriesId!),
    ])

    // Find similar content
    const where: any = {
      isPublished: true,
      genres: { some: { id: { in: topGenres } } },
    }

    const movies =
      type !== 'series'
        ? await prisma.movie.findMany({
            where: { ...where, id: { notIn: Array.from(watchedIds) } },
            include: { genres: true },
            take: limit,
          })
        : []

    const series =
      type !== 'movie'
        ? await prisma.series.findMany({
            where: { ...where, id: { notIn: Array.from(watchedIds) } },
            include: { genres: true },
            take: limit,
          })
        : []

    return [
      ...movies.map((m) => ({
        id: m.id,
        type: 'movie' as const,
        title: m.title,
        posterUrl: m.posterUrl,
        rating: m.rating || undefined,
        score: 0.7,
        reason: 'Similar to content you watched',
      })),
      ...series.map((s) => ({
        id: s.id,
        type: 'series' as const,
        title: s.title,
        posterUrl: s.posterUrl,
        rating: s.rating || undefined,
        score: 0.7,
        reason: 'Similar to content you watched',
      })),
    ].slice(0, limit)
  }

  // Trending: Popular content right now
  private async getTrendingRecommendations(limit: number, type: string): Promise<Recommendation[]> {
    const movies =
      type !== 'series'
        ? await prisma.movie.findMany({
            where: { isPublished: true, isFeatured: true },
            orderBy: { viewCount: 'desc' },
            take: limit,
          })
        : []

    const series =
      type !== 'movie'
        ? await prisma.series.findMany({
            where: { isPublished: true, isFeatured: true },
            orderBy: { viewCount: 'desc' },
            take: limit,
          })
        : []

    return [
      ...movies.map((m) => ({
        id: m.id,
        type: 'movie' as const,
        title: m.title,
        posterUrl: m.posterUrl,
        rating: m.rating || undefined,
        score: 0.8,
        reason: 'Trending now',
      })),
      ...series.map((s) => ({
        id: s.id,
        type: 'series' as const,
        title: s.title,
        posterUrl: s.posterUrl,
        rating: s.rating || undefined,
        score: 0.8,
        reason: 'Trending now',
      })),
    ].slice(0, limit)
  }

  // Hybrid: Combine multiple algorithms
  private async getHybridRecommendations(
    userId: string,
    limit: number,
    type: string
  ): Promise<Recommendation[]> {
    const [collaborative, contentBased, trending] = await Promise.all([
      this.getCollaborativeRecommendations(userId, limit, type),
      this.getContentBasedRecommendations(userId, limit, type),
      this.getTrendingRecommendations(limit, type),
    ])

    // Merge and deduplicate
    const merged = new Map<string, Recommendation>()

    // Weight: collaborative (0.4), content-based (0.4), trending (0.2)
    collaborative.forEach((r) => {
      const existing = merged.get(r.id)
      if (existing) {
        existing.score = Math.max(existing.score, r.score * 0.4)
      } else {
        merged.set(r.id, { ...r, score: r.score * 0.4 })
      }
    })

    contentBased.forEach((r) => {
      const existing = merged.get(r.id)
      if (existing) {
        existing.score = Math.max(existing.score, r.score * 0.4)
      } else {
        merged.set(r.id, { ...r, score: r.score * 0.4 })
      }
    })

    trending.forEach((r) => {
      const existing = merged.get(r.id)
      if (existing) {
        existing.score = Math.max(existing.score, r.score * 0.2)
      } else {
        merged.set(r.id, { ...r, score: r.score * 0.2 })
      }
    })

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // ML-based recommendations (if ML endpoint is configured)
  async getMLRecommendations(userId: string, limit: number = 20): Promise<Recommendation[]> {
    if (!this.mlEndpoint) {
      return this.getHybridRecommendations({ userId, limit })
    }

    try {
      const response = await fetch(`${this.mlEndpoint}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit }),
      })

      if (!response.ok) {
        throw new Error('ML recommendation failed')
      }

      const data = await response.json()
      return data.recommendations
    } catch (error) {
      console.error('ML recommendation error:', error)
      return this.getHybridRecommendations({ userId, limit })
    }
  }

  // "Because you watched" recommendations
  async getBecauseYouWatched(
    contentId: string,
    contentType: 'movie' | 'series',
    limit: number = 10
  ): Promise<Recommendation[]> {
    const content = contentType === 'movie'
      ? await prisma.movie.findUnique({
          where: { id: contentId },
          include: { genres: true },
        })
      : await prisma.series.findUnique({
          where: { id: contentId },
          include: { genres: true },
        })

    if (!content) return []

    const genreIds = content.genres.map((g) => g.id)

    if (contentType === 'movie') {
      const similar = await prisma.movie.findMany({
        where: {
          id: { not: contentId },
          isPublished: true,
          genres: { some: { id: { in: genreIds } } },
        },
        include: { genres: true },
        take: limit,
        orderBy: { rating: 'desc' },
      })

      return similar.map((m) => ({
        id: m.id,
        type: 'movie' as const,
        title: m.title,
        posterUrl: m.posterUrl,
        rating: m.rating || undefined,
        score: 0.8,
        reason: 'Similar genres',
      }))
    } else {
      const similar = await prisma.series.findMany({
        where: {
          id: { not: contentId },
          isPublished: true,
          genres: { some: { id: { in: genreIds } } },
        },
        include: { genres: true },
        take: limit,
        orderBy: { rating: 'desc' },
      })

      return similar.map((s) => ({
        id: s.id,
        type: 'series' as const,
        title: s.title,
        posterUrl: s.posterUrl,
        rating: s.rating || undefined,
        score: 0.8,
        reason: 'Similar genres',
      }))
    }
  }
}

export const recommendationService = new RecommendationService()


