import { prisma } from './prisma'

export enum AchievementType {
  FIRST_WATCH = 'FIRST_WATCH',
  BINGE_WATCHER = 'BINGE_WATCHER',
  GENRE_EXPLORER = 'GENRE_EXPLORER',
  CRITIC = 'CRITIC',
  SOCIAL_BUTTERFLY = 'SOCIAL_BUTTERFLY',
  PARTY_HOST = 'PARTY_HOST',
  STREAK_MASTER = 'STREAK_MASTER',
  COMPLETIONIST = 'COMPLETIONIST',
  EARLY_ADOPTER = 'EARLY_ADOPTER',
  LOYAL_VIEWER = 'LOYAL_VIEWER',
}

interface AchievementDefinition {
  type: AchievementType
  name: string
  description: string
  icon: string
  points: number
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: AchievementType.FIRST_WATCH,
    name: 'First Watch',
    description: 'Watch your first movie or series',
    icon: '🎬',
    points: 10,
  },
  {
    type: AchievementType.BINGE_WATCHER,
    name: 'Binge Watcher',
    description: 'Watch 10 episodes in a single day',
    icon: '📺',
    points: 25,
  },
  {
    type: AchievementType.GENRE_EXPLORER,
    name: 'Genre Explorer',
    description: 'Watch content from 5 different genres',
    icon: '🗺️',
    points: 30,
  },
  {
    type: AchievementType.CRITIC,
    name: 'Critic',
    description: 'Write 10 reviews',
    icon: '⭐',
    points: 40,
  },
  {
    type: AchievementType.SOCIAL_BUTTERFLY,
    name: 'Social Butterfly',
    description: 'Follow 10 users',
    icon: '🦋',
    points: 20,
  },
  {
    type: AchievementType.PARTY_HOST,
    name: 'Party Host',
    description: 'Host 5 watch parties',
    icon: '🎉',
    points: 35,
  },
  {
    type: AchievementType.STREAK_MASTER,
    name: 'Streak Master',
    description: 'Watch content for 7 consecutive days',
    icon: '🔥',
    points: 50,
  },
  {
    type: AchievementType.COMPLETIONIST,
    name: 'Completionist',
    description: 'Complete 50 movies or series',
    icon: '✅',
    points: 60,
  },
  {
    type: AchievementType.EARLY_ADOPTER,
    name: 'Early Adopter',
    description: 'Join within the first month',
    icon: '🚀',
    points: 15,
  },
  {
    type: AchievementType.LOYAL_VIEWER,
    name: 'Loyal Viewer',
    description: 'Watch 100 hours of content',
    icon: '👑',
    points: 75,
  },
]

/**
 * Initialize achievements in database
 */
export async function initializeAchievements() {
  try {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievement.upsert({
        where: { type: def.type },
        update: {
          name: def.name,
          description: def.description,
          icon: def.icon,
          points: def.points,
        },
        create: def,
      })
    }
    console.log('✅ Achievements initialized successfully')
  } catch (error) {
    console.error('Error initializing achievements:', error)
    throw error
  }
}

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string) {
  const awarded: string[] = []

  // Get user's existing achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  })
  const earnedTypes = new Set(userAchievements.map(ua => ua.achievement.type))

  // Check FIRST_WATCH
  if (!earnedTypes.has(AchievementType.FIRST_WATCH)) {
    const watchHistory = await prisma.watchHistory.findFirst({
      where: { userId },
    })
    if (watchHistory) {
      await awardAchievement(userId, AchievementType.FIRST_WATCH)
      awarded.push(AchievementType.FIRST_WATCH)
    }
  }

  // Check CRITIC
  if (!earnedTypes.has(AchievementType.CRITIC)) {
    const reviewCount = await prisma.review.count({
      where: { userId },
    })
    if (reviewCount >= 10) {
      await awardAchievement(userId, AchievementType.CRITIC)
      awarded.push(AchievementType.CRITIC)
    }
  }

  // Check SOCIAL_BUTTERFLY
  if (!earnedTypes.has(AchievementType.SOCIAL_BUTTERFLY)) {
    const followingCount = await prisma.userFollow.count({
      where: { followerId: userId },
    })
    if (followingCount >= 10) {
      await awardAchievement(userId, AchievementType.SOCIAL_BUTTERFLY)
      awarded.push(AchievementType.SOCIAL_BUTTERFLY)
    }
  }

  // Check PARTY_HOST
  if (!earnedTypes.has(AchievementType.PARTY_HOST)) {
    const partyCount = await prisma.watchParty.count({
      where: { hostId: userId },
    })
    if (partyCount >= 5) {
      await awardAchievement(userId, AchievementType.PARTY_HOST)
      awarded.push(AchievementType.PARTY_HOST)
    }
  }

  // Check COMPLETIONIST
  if (!earnedTypes.has(AchievementType.COMPLETIONIST)) {
    const completedCount = await prisma.watchHistory.count({
      where: {
        userId,
        completed: true,
      },
    })
    if (completedCount >= 50) {
      await awardAchievement(userId, AchievementType.COMPLETIONIST)
      awarded.push(AchievementType.COMPLETIONIST)
    }
  }

    // Check GENRE_EXPLORER
    if (!earnedTypes.has(AchievementType.GENRE_EXPLORER)) {
      // Optimized: Only fetch what we need for genre checking
      const watchHistoryQuery: any = {
        where: { userId },
        select: {
          movieId: true,
          seriesId: true,
          episodeId: true,
          movie: {
            select: {
              genres: {
                select: { name: true },
              },
            },
          },
          series: {
            select: {
              genres: {
                select: { name: true },
              },
            },
          },
          episode: {
            select: {
              series: {
                select: {
                  genres: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      };
      const watchHistory: any = await prisma.watchHistory.findMany(watchHistoryQuery);

      const uniqueGenres = new Set<string>()
      watchHistory.forEach((h: any) => {
        const genres = h.movie?.genres || h.series?.genres || h.episode?.series?.genres || []
        genres.forEach((g: any) => {
          uniqueGenres.add(g.name || g)
        })
      })

    if (uniqueGenres.size >= 5) {
      await awardAchievement(userId, AchievementType.GENRE_EXPLORER)
      awarded.push(AchievementType.GENRE_EXPLORER)
    }
  }

  // Check STREAK_MASTER (7 consecutive days)
  if (!earnedTypes.has(AchievementType.STREAK_MASTER)) {
    const watchHistory = await prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { lastWatchedAt: 'desc' },
    })

    const watchDates = watchHistory
      .map(h => new Date(h.lastWatchedAt).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort()
      .reverse()

    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (watchDates.length > 0 && (watchDates[0] === today || watchDates[0] === yesterday)) {
      streak = 1
      for (let i = 1; i < watchDates.length; i++) {
        const currentDate = new Date(watchDates[i - 1])
        const previousDate = new Date(watchDates[i])
        const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }

    if (streak >= 7) {
      await awardAchievement(userId, AchievementType.STREAK_MASTER)
      awarded.push(AchievementType.STREAK_MASTER)
    }
  }

  // Check LOYAL_VIEWER (100 hours)
  if (!earnedTypes.has(AchievementType.LOYAL_VIEWER)) {
    const watchHistory = await prisma.watchHistory.findMany({
      where: { userId },
    })

    const totalSeconds = watchHistory.reduce((sum, h) => sum + (h.currentTime || 0), 0)
    const totalHours = totalSeconds / 3600

    if (totalHours >= 100) {
      await awardAchievement(userId, AchievementType.LOYAL_VIEWER)
      awarded.push(AchievementType.LOYAL_VIEWER)
    }
  }

  // Check EARLY_ADOPTER (joined within first month of platform)
  if (!earnedTypes.has(AchievementType.EARLY_ADOPTER)) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (user) {
      const daysSinceJoin = Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceJoin <= 30) {
        await awardAchievement(userId, AchievementType.EARLY_ADOPTER)
        awarded.push(AchievementType.EARLY_ADOPTER)
      }
    }
  }

  return awarded
}

/**
 * Award an achievement to a user
 */
async function awardAchievement(userId: string, type: AchievementType) {
  const achievement = await prisma.achievement.findUnique({
    where: { type },
  })

  if (!achievement) {
    console.error(`Achievement ${type} not found`)
    return
  }

  // Check if already earned
  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  })

  if (existing) {
    return // Already earned
  }

  // Award achievement
  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
    },
  })

  // Create activity
  await createActivity(userId, 'EARNED_ACHIEVEMENT', null, null, {
    achievementName: achievement.name,
    achievementType: type,
  })

  console.log(`✅ Awarded achievement ${achievement.name} to user ${userId}`)
}

/**
 * Create an activity entry
 */
export async function createActivity(
  userId: string,
  type: 'WATCHED' | 'REVIEWED' | 'ADDED_TO_LIST' | 'CREATED_PLAYLIST' | 'FOLLOWED_USER' | 'EARNED_ACHIEVEMENT' | 'SHARED_CONTENT',
  contentId: string | null,
  contentType: 'movie' | 'series' | null,
  metadata?: any
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: type as any,
        contentId: contentId || null,
        contentType: contentType || null,
        metadata: metadata || {},
      },
    })
  } catch (error) {
    console.error('Error creating activity:', error)
  }
}
