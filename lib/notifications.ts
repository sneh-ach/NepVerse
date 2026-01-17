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
      console.log('[Notification Email] 📧 Attempting to send email for notification:', notification.id)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      })

      if (!user) {
        console.error('[Notification Email] ❌ User not found:', userId)
        return notification
      }

      if (!user.email) {
        console.warn('[Notification Email] ⚠️ User has no email:', userId)
        return notification
      }

      console.log('[Notification Email] 👤 User found:', user.email, {
        emailVerified: user.emailVerified,
        emailNotifications: user.emailNotifications,
      })

      const name = user.profile?.firstName || user.email.split('@')[0]
      let emailSent = false

      if (type === 'new_movie' && link) {
        // Extract movie ID from link
        const movieId = link.split('/movie/')[1]?.split('?')[0]
        console.log('[Notification Email] 🎬 Extracted movie ID from link:', movieId, 'from link:', link)
        
        if (movieId) {
          const movie = await prisma.movie.findUnique({
            where: { id: movieId },
          })
          
          if (movie) {
            console.log('[Notification Email] ✅ Movie found, sending email to:', user.email)
            emailSent = await emailService.sendNewMovieNotificationEmail(
              user.email,
              name,
              movie
            )
            console.log('[Notification Email]', emailSent ? '✅ Email sent successfully' : '❌ Email failed to send')
          } else {
            console.error('[Notification Email] ❌ Movie not found:', movieId)
          }
        } else {
          console.error('[Notification Email] ❌ Could not extract movie ID from link:', link)
        }
      } else {
        console.warn('[Notification Email] ⚠️ Email not sent - type:', type, 'link:', link)
      }

      if (emailSent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true },
        })
        console.log('[Notification Email] ✅ Updated notification emailSent flag')
      } else {
        console.warn('[Notification Email] ⚠️ Email not sent, notification emailSent remains false')
      }
    } catch (error) {
      console.error('[Notification Email] ❌ Error sending notification email:', error)
      // Don't fail notification creation if email fails
    }
  } else {
    console.log('[Notification Email] ⏭️ Email sending skipped (sendEmail=false)')
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

    // Get ALL users for in-app notifications (regardless of email verification)
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, emailVerified: true, emailNotifications: true },
    })

    console.log('[Notifications] 👥 Found users:', {
      total: allUsers.length,
      emailEligible: sendEmails ? allUsers.filter(u => u.emailVerified && u.emailNotifications).length : 0,
      userDetails: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        emailVerified: u.emailVerified,
        emailNotifications: u.emailNotifications,
      })),
    })

    if (allUsers.length === 0) {
      console.warn('[Notifications] ⚠️ No users found in database')
      return { created: 0, errors: ['No users found'] }
    }

    const results = {
      created: 0,
      errors: [] as string[],
    }

    // Create notifications for ALL users (in-app notifications)
    // Emails will only be sent to verified users who opted in
    const allUserPromises = allUsers.map(async (user) => {
      try {
        const shouldSendEmail = sendEmails && user.emailVerified && user.emailNotifications
        console.log('[Notifications] 📝 Creating notification for user:', user.id, {
          email: user.email,
          emailVerified: user.emailVerified,
          emailNotifications: user.emailNotifications,
          willSendEmail: shouldSendEmail,
        })
        
        await createNotification({
          userId: user.id,
          type: 'new_movie',
          title: `🎬 New Movie: ${movie.title}`,
          message: `${movie.title}${movie.titleNepali ? ` (${movie.titleNepali})` : ''} is now available to watch!`,
          link: `/movie/${movie.id}`,
          imageUrl: movie.posterUrl,
          sendEmail: shouldSendEmail, // Only send email if user verified and opted in
        })
        results.created++
        console.log('[Notifications] ✅ Created notification for user:', user.id)
      } catch (error: any) {
        const errorMsg = `User ${user.id}: ${error.message}`
        results.errors.push(errorMsg)
        console.error('[Notifications] ❌ Error creating notification:', errorMsg, error)
      }
    })

    await Promise.all(allUserPromises)

    const emailEligibleCount = sendEmails 
      ? allUsers.filter(u => u.emailVerified && u.emailNotifications).length 
      : 0

    console.log('[Notifications] 📊 Results:', {
      created: results.created,
      errors: results.errors.length,
      totalUsers: allUsers.length,
      emailEligible: emailEligibleCount,
      errorDetails: results.errors.length > 0 ? results.errors : undefined,
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

/**
 * Create notifications for users watching a series when a new episode is published
 */
export async function notifyNewEpisode(seriesId: string, episodeId: string, sendEmails = false) {
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        series: true,
      },
    })

    if (!episode || !episode.isPublished || !episode.series.isPublished) {
      return { created: 0, errors: [] }
    }

    // Get users who have watched this series (have watch history)
    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        seriesId,
        completed: false, // Only notify users who haven't finished the series
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })

    const userIds = watchHistory.map(wh => wh.userId)

    if (userIds.length === 0) {
      return { created: 0, errors: [] }
    }

    // Get user details for those who want notifications
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        emailVerified: true,
        emailNotifications: sendEmails ? true : undefined,
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
          type: 'new_series', // Reuse new_series type for episodes
          title: `📺 New Episode: ${episode.series.title}`,
          message: `Episode ${episode.episodeNumber}: ${episode.title} is now available!`,
          link: `/series/${seriesId}?episode=${episodeId}`,
          imageUrl: episode.thumbnailUrl || episode.series.posterUrl,
          sendEmail: sendEmails && user.emailNotifications,
        })
        results.created++
      } catch (error: any) {
        results.errors.push(`User ${user.id}: ${error.message}`)
      }
    })

    await Promise.all(notificationPromises)

    return results
  } catch (error) {
    console.error('Error notifying new episode:', error)
    return { created: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
  }
}
