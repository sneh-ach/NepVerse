// Database helper functions using Prisma
import { prisma } from './prisma'
import { hashPassword, comparePassword } from './auth'
import { generatePasswordResetToken, generateEmailVerificationToken, hashToken } from './security'

// User operations
export const db = {
  // User operations
  user: {
    async findByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } })
    },
    
    async findByPhone(phone: string) {
      return prisma.user.findUnique({ where: { phone } })
    },
    
    async findById(id: string) {
      return prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    },
    
    async create(data: {
      email?: string
      phone?: string
      password: string
      firstName?: string
      lastName?: string
    }) {
      const passwordHash = await hashPassword(data.password)
      
      return prisma.user.create({
        data: {
          email: data.email,
          phone: data.phone,
          passwordHash,
          profile: data.firstName || data.lastName ? {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
            },
          } : undefined,
        },
        include: {
          profile: true,
        },
      })
    },
    
    async verifyPassword(userId: string, password: string): Promise<boolean> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      })
      
      if (!user) return false
      return comparePassword(password, user.passwordHash)
    },
    
    async updatePassword(userId: string, newPassword: string) {
      const passwordHash = await hashPassword(newPassword)
      return prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      })
    },
    
    async verifyEmail(userId: string) {
      return prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      })
    },
    
    async createPasswordResetToken(userId: string) {
      const token = generatePasswordResetToken()
      const hashedToken = hashToken(token)
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour
      
      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash: hashedToken,
          expiresAt,
        },
      })
      
      return { token, hashedToken, expiresAt }
    },
    
    async verifyPasswordResetToken(token: string) {
      const hashedToken = hashToken(token)
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          tokenHash: hashedToken,
          expiresAt: { gt: new Date() },
          used: false,
        },
        include: { user: true },
      })
      
      return resetToken
    },
    
    async markPasswordResetTokenUsed(tokenId: string) {
      await prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { used: true },
      })
    },
    
    async createEmailVerificationToken(userId: string) {
      const token = generateEmailVerificationToken()
      const hashedToken = hashToken(token)
      const expiresAt = new Date(Date.now() + 86400000) // 24 hours
      
      await prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: hashedToken,
          expiresAt,
        },
      })
      
      return { token, hashedToken, expiresAt }
    },
    
    async verifyEmailVerificationToken(token: string) {
      const hashedToken = hashToken(token)
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash: hashedToken,
          expiresAt: { gt: new Date() },
          used: false,
        },
        include: { user: true },
      })
      
      return verificationToken
    },
    
    async markEmailVerificationTokenUsed(tokenId: string) {
      await prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { used: true },
      })
    },
  },
  
  // Profile operations
  profile: {
    async update(userId: string, data: {
      firstName?: string
      lastName?: string
      avatar?: string
      country?: string
      language?: string
    }) {
      return prisma.profile.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      })
    },
  },
  
  // Watch history operations
  watchHistory: {
    async upsert(userId: string, data: {
      movieId?: string
      seriesId?: string
      episodeId?: string
      progress: number
      currentTime: number
      duration: number
      completed?: boolean
    }) {
      if (data.movieId) {
        return prisma.watchHistory.upsert({
          where: {
            userId_movieId: {
              userId,
              movieId: data.movieId,
            },
          },
          update: {
            progress: data.progress,
            currentTime: data.currentTime,
            duration: data.duration,
            completed: data.completed || false,
            lastWatchedAt: new Date(),
          },
          create: {
            userId,
            movieId: data.movieId,
            progress: data.progress,
            currentTime: data.currentTime,
            duration: data.duration,
            completed: data.completed || false,
          },
        })
      }
      
      if (data.seriesId && data.episodeId) {
        return prisma.watchHistory.upsert({
          where: {
            userId_seriesId_episodeId: {
              userId,
              seriesId: data.seriesId,
              episodeId: data.episodeId,
            },
          },
          update: {
            progress: data.progress,
            currentTime: data.currentTime,
            duration: data.duration,
            completed: data.completed || false,
            lastWatchedAt: new Date(),
          },
          create: {
            userId,
            seriesId: data.seriesId,
            episodeId: data.episodeId,
            progress: data.progress,
            currentTime: data.currentTime,
            duration: data.duration,
            completed: data.completed || false,
          },
        })
      }
      
      throw new Error('Invalid watch history data')
    },
    
    async getByUser(userId: string) {
      return prisma.watchHistory.findMany({
        where: { userId },
        include: {
          movie: true,
          series: true,
          episode: true,
        },
        orderBy: { lastWatchedAt: 'desc' },
        take: 50,
      })
    },
    
    async delete(userId: string, movieId?: string, seriesId?: string, episodeId?: string) {
      if (movieId) {
        return prisma.watchHistory.deleteMany({
          where: { userId, movieId },
        })
      }
      if (seriesId && episodeId) {
        return prisma.watchHistory.deleteMany({
          where: { userId, seriesId, episodeId },
        })
      }
      return prisma.watchHistory.deleteMany({
        where: { userId },
      })
    },
  },
  
  // Watchlist operations
  watchList: {
    async add(userId: string, movieId?: string, seriesId?: string) {
      if (movieId) {
        return prisma.watchList.upsert({
          where: {
            userId_movieId: {
              userId,
              movieId,
            },
          },
          update: {},
          create: {
            userId,
            movieId,
          },
        })
      }
      if (seriesId) {
        return prisma.watchList.upsert({
          where: {
            userId_seriesId: {
              userId,
              seriesId,
            },
          },
          update: {},
          create: {
            userId,
            seriesId,
          },
        })
      }
      throw new Error('Either movieId or seriesId is required')
    },
    
    async remove(userId: string, movieId?: string, seriesId?: string) {
      if (movieId) {
        return prisma.watchList.deleteMany({
          where: { userId, movieId },
        })
      }
      if (seriesId) {
        return prisma.watchList.deleteMany({
          where: { userId, seriesId },
        })
      }
      return prisma.watchList.deleteMany({
        where: { userId },
      })
    },
    
    async getByUser(userId: string) {
      return prisma.watchList.findMany({
        where: { userId },
        include: {
          movie: true,
          series: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  },
}

