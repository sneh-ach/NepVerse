// Notification service for creating and managing notifications
import { prisma } from './prisma'
import { emailService } from './email'

export interface CreateNotificationOptions {
  userId: string
  type: 'new_movie' | 'new_series' | 'system' | 'promotion'
  title: string
  message: string
  link?: string
  imageUrl?: string
  sendEmail?: boolean
}

/**
 * Create a notification for a user
 */
export async function createNotification(options: CreateNotificationOptions) {
  const { userId, type, title, message, link, imageUrl, sendEmail = false } = options

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: link || null,
      imageUrl: imageUrl || null,
      emailSent: false,
    },
  })

  // Send email if requested
  if (sendEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      })

      if (user?.email) {
        const name = user.profile?.firstName || user.email.split('@')[0]
        let emailSent = false

        if (type === 'new_movie' && link) {
          // Extract movie ID from link
          const movieId = link.split('/movie/')[1]?.split('?')[0]
          if (movieId) {
            const movie = await prisma.movie.findUnique({
              where: { id: movieId },
            })
            if (movie) {
              emailSent = await emailService.sendNewMovieNotificationEmail(
                user.email,
                name,
                movie
              )
            }
          }
        }

        if (emailSent) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          })
        }
      }
    } catch (error) {
      console.error('Error sending notification email:', error)
      // Don't fail notification creation if email fails
    }
  }

  return notification
}

/**
 * Create notifications for all users when a new movie is published
 */
export async function notifyNewMovie(movieId: string, sendEmails = false) {
  try {
    console.log('[Notifications] 🎬 Starting notification process for movie:', movieId)
    
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    })

    if (!movie) {
      console.error('[Notifications] ❌ Movie not found:', movieId)
      return { created: 0, errors: ['Movie not found'] }
    }

    if (!movie.isPublished) {
      console.log('[Notifications] ⚠️ Movie is not published, skipping notifications:', movieId)
      return { created: 0, errors: [] }
    }

    console.log('[Notifications] ✅ Movie found and published:', movie.title)

    // Get all users (not just verified) - we'll send notifications to all users
    // For emails, we'll only send to verified users who opted in
    const users = await prisma.user.findMany({
      where: sendEmails
        ? {
            emailVerified: true, // Only verified users for emails
            emailNotifications: true, // Only users who opted in
          }
        : {}, // For in-app notifications, send to all users
      select: { id: true, email: true, emailVerified: true, emailNotifications: true },
    })

    console.log('[Notifications] 👥 Found users:', users.length)

    if (users.length === 0) {
      console.warn('[Notifications] ⚠️ No users found to notify')
      return { created: 0, errors: ['No users found'] }
    }

    const results = {
      created: 0,
      errors: [] as string[],
    }

    const notificationPromises = users.map(async (user) => {
      try {
        await createNotification({
          userId: user.id,
          type: 'new_movie',
          title: `🎬 New Movie: ${movie.title}`,
          message: `${movie.title}${movie.titleNepali ? ` (${movie.titleNepali})` : ''} is now available to watch!`,
          link: `/movie/${movie.id}`,
          imageUrl: movie.posterUrl,
          sendEmail: sendEmails && user.emailVerified && user.emailNotifications, // Only send email if user verified and opted in
        })
        results.created++
        console.log('[Notifications] ✅ Created notification for user:', user.id)
      } catch (error: any) {
        const errorMsg = `User ${user.id}: ${error.message}`
        results.errors.push(errorMsg)
        console.error('[Notifications] ❌ Error creating notification:', errorMsg)
      }
    })

    await Promise.all(notificationPromises)

    console.log('[Notifications] 📊 Results:', {
      created: results.created,
      errors: results.errors.length,
      totalUsers: users.length,
    })

    return results
  } catch (error) {
    console.error('[Notifications] ❌ Error notifying new movie:', error)
    return { created: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}

/**
 * Create notifications for all users when a new series is published
 */
export async function notifyNewSeries(seriesId: string, sendEmails = false) {
  try {
    const series = await prisma.series.findUnique({
      where: { id: seriesId },
    })

    if (!series || !series.isPublished) {
      return { created: 0, errors: [] }
    }

    // Get all active users who want notifications
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true, // Only verified users
        emailNotifications: sendEmails ? true : undefined, // If sending emails, only to users who opted in
      },
      select: { id: true, emailNotifications: true },
    })

    const results = {
      created: 0,
      errors: [] as string[],
    }

    const notificationPromises = users.map(async (user) => {
      try {
        await createNotification({
          userId: user.id,
          type: 'new_series',
          title: `📺 New Series: ${series.title}`,
          message: `${series.title}${series.titleNepali ? ` (${series.titleNepali})` : ''} is now available!`,
          link: `/series/${series.id}`,
          imageUrl: series.posterUrl,
          sendEmail: sendEmails && user.emailNotifications, // Only send email if user opted in
        })
        results.created++
      } catch (error: any) {
        results.errors.push(`User ${user.id}: ${error.message}`)
      }
    })

    await Promise.all(notificationPromises)

    return results
  } catch (error) {
    console.error('Error notifying new series:', error)
    return { created: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}
