import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Movies
  const movies = await prisma.movie.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
    take: 1000, // Limit for performance
  })

  const moviePages: MetadataRoute.Sitemap = movies.map((movie) => ({
    url: `${baseUrl}/movie/${movie.id}`,
    lastModified: movie.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Series
  const series = await prisma.series.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
    take: 1000,
  })

  const seriesPages: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${baseUrl}/series/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...moviePages, ...seriesPages]
}


