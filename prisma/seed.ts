import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { slug: 'drama' },
      update: {},
      create: {
        name: 'Drama',
        nameNepali: 'नाटक',
        slug: 'drama',
        description: 'Dramatic stories and narratives',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'romance' },
      update: {},
      create: {
        name: 'Romance',
        nameNepali: 'रोमान्स',
        slug: 'romance',
        description: 'Romantic stories',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'thriller' },
      update: {},
      create: {
        name: 'Thriller',
        nameNepali: 'थ्रिलर',
        slug: 'thriller',
        description: 'Suspenseful and thrilling content',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'comedy' },
      update: {},
      create: {
        name: 'Comedy',
        nameNepali: 'कमेडी',
        slug: 'comedy',
        description: 'Funny and entertaining content',
      },
    }),
    prisma.genre.upsert({
      where: { slug: 'action' },
      update: {},
      create: {
        name: 'Action',
        nameNepali: 'एक्शन',
        slug: 'action',
        description: 'Action-packed content',
      },
    }),
  ])

  console.log('Created genres:', genres.length)

  // Create sample movie
  const dramaGenre = genres.find((g) => g.slug === 'drama')
  const thrillerGenre = genres.find((g) => g.slug === 'thriller')

  if (dramaGenre && thrillerGenre) {
    await prisma.movie.upsert({
      where: { id: 'sample-movie-1' },
      update: {},
      create: {
        id: 'sample-movie-1',
        title: 'Loot',
        titleNepali: 'लुट',
        description:
          'A thrilling heist drama set in modern Kathmandu, following a group of friends who plan the perfect robbery. As their plan unfolds, secrets are revealed and loyalties are tested.',
        descriptionNepali:
          'आधुनिक काठमाडौंमा सेट गरिएको एक रोमाञ्चक हिस्ट ड्रामा, जसमा साथीहरूको समूहले उत्तम डकैतीको योजना बनाउँछ।',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
        backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920',
        releaseDate: new Date('2023-05-15'),
        duration: 120,
        rating: 8.5,
        ageRating: 'PG-13',
        isPublished: true,
        isFeatured: true,
        videoUrl: '/videos/sample.m3u8',
        genres: {
          connect: [{ id: dramaGenre.id }, { id: thrillerGenre.id }],
        },
      },
    })

    console.log('Created sample movie')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




