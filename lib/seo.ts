// SEO utilities
// Generates meta tags, structured data, sitemaps

import { Metadata } from 'next'

export interface SEOData {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'video.movie' | 'video.tv_show'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
}

export function generateMetadata(data: SEOData): Metadata {
  const title = `${data.title} | NepVerse`
  const description = data.description
  const image = data.image || '/og-image.jpg'
  const url = data.url || 'https://nepverse.com'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'NepVerse',
      images: [{ url: image }],
      type: data.type || 'website',
      ...(data.publishedTime && { publishedTime: data.publishedTime }),
      ...(data.modifiedTime && { modifiedTime: data.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  }
}

export function generateStructuredData(data: {
  type: 'Movie' | 'TVSeries'
  name: string
  description: string
  image: string
  datePublished: string
  director?: string
  actor?: string[]
  rating?: number
  duration?: string
}): object {
  const base = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
  }

  if (data.type === 'Movie') {
    return {
      ...base,
      ...(data.director && { director: { '@type': 'Person', name: data.director } }),
      ...(data.actor && {
        actor: data.actor.map((name) => ({ '@type': 'Person', name })),
      }),
      ...(data.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating,
          bestRating: 10,
        },
      }),
      ...(data.duration && { duration: data.duration }),
    }
  }

  return base
}

export function generateSitemap(entries: Array<{ url: string; lastModified?: Date; changeFrequency?: string; priority?: number }>): string {
  const urls = entries.map((entry) => {
    return `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : ''}
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function generateRobotsTxt(allow: boolean = true, sitemapUrl?: string): string {
  const rules = allow
    ? `User-agent: *
Allow: /`
    : `User-agent: *
Disallow: /`

  return `${rules}
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}`
}


