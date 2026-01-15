import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nepverse.com' },
    update: {},
    create: {
      email: 'admin@nepverse.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
        },
      },
    },
    include: { profile: true },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create test user
  const userPassword = await hashPassword('user123')
  const user = await prisma.user.upsert({
    where: { email: 'user@nepverse.com' },
    update: {},
    create: {
      email: 'user@nepverse.com',
      passwordHash: userPassword,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    },
    include: { profile: true },
  })
  console.log('✅ Created test user:', user.email)

  // Create genres
  const genres = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller',
    'Sci-Fi', 'Fantasy', 'Documentary', 'Animation', 'Crime', 'Adventure'
  ]

  const createdGenres = await Promise.all(
    genres.map((name) =>
      prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      })
    )
  )
  console.log(`✅ Created ${createdGenres.length} genres`)

  // Create sample movies
  const movies = [
    {
      title: 'Nepal: A Journey Through Time',
      titleNepali: 'नेपाल: समयको यात्रा',
      description: 'An epic journey through the history and culture of Nepal.',
      descriptionNepali: 'नेपालको इतिहास र संस्कृतिको महाकाव्य यात्रा।',
      releaseDate: new Date('2024-01-15'),
      duration: 120,
      rating: 8.5,
      ageRating: 'PG-13',
      posterUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500',
      backdropUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1920',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      genres: ['Documentary', 'Adventure'],
    },
    {
      title: 'Himalayan Dreams',
      titleNepali: 'हिमाली सपना',
      description: 'A story of adventure and discovery in the Himalayas.',
      descriptionNepali: 'हिमालयमा साहसिक र खोजको कथा।',
      releaseDate: new Date('2024-02-20'),
      duration: 105,
      rating: 7.8,
      ageRating: 'PG',
      posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500',
      backdropUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      genres: ['Adventure', 'Drama'],
    },
  ]

  for (const movieData of movies) {
    const { genres: genreNames, ...movieFields } = movieData
    const movie = await prisma.movie.create({
      data: {
        ...movieFields,
        genres: {
          connect: genreNames.map((name) => ({ name })),
        },
      },
    })
    console.log(`✅ Created movie: ${movie.title}`)
  }

  // Create sample series
  const series = [
    {
      title: 'Kathmandu Chronicles',
      titleNepali: 'काठमाडौं क्रनिकल्स',
      description: 'A series exploring the stories of Kathmandu.',
      descriptionNepali: 'काठमाडौंका कथाहरू अन्वेषण गर्ने श्रृंखला।',
      releaseDate: new Date('2024-03-01'),
      rating: 8.2,
      ageRating: 'TV-14',
      posterUrl: 'https://images.unsplash.com/photo-1524419986249-348e8fa6ad5a?w=500',
      backdropUrl: 'https://images.unsplash.com/photo-1524419986249-348e8fa6ad5a?w=1920',
      trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      genres: ['Drama', 'Crime'],
    },
  ]

  for (const seriesData of series) {
    const { genres: genreNames, ...seriesFields } = seriesData
    const series = await prisma.series.create({
      data: {
        ...seriesFields,
        genres: {
          connect: genreNames.map((name) => ({ name })),
        },
        episodes: {
          create: [
            {
              episodeNumber: 1,
              title: 'The Beginning',
              description: 'The first episode of the series.',
              duration: 45,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            },
            {
              episodeNumber: 2,
              title: 'The Journey Continues',
              description: 'The second episode of the series.',
              duration: 45,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            },
          ],
        },
      },
    })
    console.log(`✅ Created series: ${series.title}`)
  }

  // Create subscription plans
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 499,
      currency: 'NPR',
      features: ['SD Quality', '1 Device', 'Basic Support'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 799,
      currency: 'NPR',
      features: ['HD Quality', '2 Devices', 'Priority Support'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 1199,
      currency: 'NPR',
      features: ['4K Quality', '4 Devices', '24/7 Support'],
    },
  ]

  // Note: Subscription plans are not in the schema, skipping for now
  // for (const plan of plans) {
  //   await prisma.subscriptionPlan.upsert({
  //     where: { id: plan.id },
  //     update: {},
  //     create: plan,
  //   })
  //   console.log(`✅ Created plan: ${plan.name}`)
  // }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


