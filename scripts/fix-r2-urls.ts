/**
 * Script to fix R2 URLs in database
 * Converts old R2 URLs to proxy URLs
 * 
 * Run with: npx tsx scripts/fix-r2-urls.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixR2Urls() {
  try {
    console.log('🔧 Fixing R2 URLs in database...')

    // Fix movie poster/backdrop URLs
    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { posterUrl: { contains: 'r2.cloudflarestorage.com' } },
          { backdropUrl: { contains: 'r2.cloudflarestorage.com' } },
        ],
      },
    })

    console.log(`Found ${movies.length} movies with R2 URLs`)

    for (const movie of movies) {
      const updates: any = {}

      // Fix poster URL
      if (movie.posterUrl?.includes('r2.cloudflarestorage.com')) {
        // Extract key from URL like: https://account.r2.cloudflarestorage.com/posters/file.jpg
        const urlParts = movie.posterUrl.split('/')
        const key = urlParts.slice(3).join('/') // Get everything after domain
        updates.posterUrl = `/api/storage/proxy?key=${encodeURIComponent(key)}`
      }

      // Fix backdrop URL
      if (movie.backdropUrl?.includes('r2.cloudflarestorage.com')) {
        const urlParts = movie.backdropUrl.split('/')
        const key = urlParts.slice(3).join('/')
        updates.backdropUrl = `/api/storage/proxy?key=${encodeURIComponent(key)}`
      }

      if (Object.keys(updates).length > 0) {
        await prisma.movie.update({
          where: { id: movie.id },
          data: updates,
        })
        console.log(`✅ Fixed movie: ${movie.title}`)
      }
    }

    // Fix series poster/backdrop URLs
    const series = await prisma.series.findMany({
      where: {
        OR: [
          { posterUrl: { contains: 'r2.cloudflarestorage.com' } },
          { backdropUrl: { contains: 'r2.cloudflarestorage.com' } },
        ],
      },
    })

    console.log(`Found ${series.length} series with R2 URLs`)

    for (const s of series) {
      const updates: any = {}

      if (s.posterUrl?.includes('r2.cloudflarestorage.com')) {
        const urlParts = s.posterUrl.split('/')
        const key = urlParts.slice(3).join('/')
        updates.posterUrl = `/api/storage/proxy?key=${encodeURIComponent(key)}`
      }

      if (s.backdropUrl?.includes('r2.cloudflarestorage.com')) {
        const urlParts = s.backdropUrl.split('/')
        const key = urlParts.slice(3).join('/')
        updates.backdropUrl = `/api/storage/proxy?key=${encodeURIComponent(key)}`
      }

      if (Object.keys(updates).length > 0) {
        await prisma.series.update({
          where: { id: s.id },
          data: updates,
        })
        console.log(`✅ Fixed series: ${s.title}`)
      }
    }

    console.log('✅ All R2 URLs fixed!')
  } catch (error) {
    console.error('❌ Error fixing URLs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixR2Urls()
