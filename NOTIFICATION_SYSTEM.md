# Notification System Documentation

## Overview

A comprehensive notification system has been implemented for NepVerse that includes:
- **In-app notifications** (bell icon in header)
- **Email notifications** for new movies
- **Automatic notifications** when content is published
- **User preferences** for email notifications

## Features

### 1. In-App Notifications
- **Bell icon** in the header with unread count badge
- **Dropdown menu** showing recent notifications
- **Real-time updates** (polls every 30 seconds)
- **Click to navigate** to content
- **Mark as read** individually or all at once
- **Beautiful UI** with movie posters, icons, and animations

### 2. Email Notifications
- **Beautiful email templates** for new movies
- **Movie poster** included in email
- **Direct link** to watch the movie
- **Opt-in/opt-out** preferences for users
- **Respects user preferences** - only sends to users who opted in

### 3. Automatic Notifications
- **When movies are published**: All users get in-app notifications
- **When series are published**: All users get in-app notifications
- **When movies are updated to published**: Notifications are created
- **Only for verified users**: Only sends to users with verified emails

## Database Schema

### Notification Model
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'new_movie', 'new_series', 'system', 'promotion'
  title     String
  message   String
  link      String?  // Optional link to content
  imageUrl  String?  // Optional image (poster for movies)
  read      Boolean  @default(false)
  emailSent Boolean  @default(false)
  createdAt DateTime @default(now())
  readAt    DateTime?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### User Model (Updated)
```prisma
model User {
  // ... existing fields
  emailNotifications Boolean @default(true) // Opt-in for email notifications
  notifications      Notification[]
}
```

## API Endpoints

### GET `/api/notifications`
Get user's notifications
- Query params: `?unread=true`, `?limit=50`, `?offset=0`
- Returns: `{ notifications, total, unreadCount }`

### POST `/api/notifications`
Mark notifications as read
- Body: `{ notificationId: string }` or `{ markAllAsRead: true }`

### GET `/api/user/notifications/preferences`
Get user's notification preferences
- Returns: `{ emailNotifications: boolean }`

### PATCH `/api/user/notifications/preferences`
Update user's notification preferences
- Body: `{ emailNotifications: boolean }`

## Usage

### Creating Notifications

```typescript
import { createNotification, notifyNewMovie } from '@/lib/notifications'

// Create a single notification
await createNotification({
  userId: 'user-id',
  type: 'new_movie',
  title: '🎬 New Movie: Movie Title',
  message: 'Movie Title is now available!',
  link: '/movie/movie-id',
  imageUrl: '/posters/movie.jpg',
  sendEmail: false, // Set to true to send email
})

// Notify all users about a new movie
await notifyNewMovie('movie-id', false) // false = don't send emails
```

### Notification Types
- `new_movie` - New movie available
- `new_series` - New series available
- `system` - System notifications
- `promotion` - Promotional notifications

## UI Component

The `Notifications` component is already integrated into the header:
- Shows unread count badge
- Opens dropdown on click
- Displays notifications with images/icons
- Click to navigate to content
- Mark as read functionality

## Email Templates

Beautiful email templates for:
- **New Movie Notifications**: Includes movie poster, title, description, and watch button
- Uses table-based HTML for email client compatibility
- Responsive design
- Matches NepVerse branding

## Automatic Notifications

Notifications are automatically created when:
1. **New movie is uploaded** and published (`isPublished: true`)
2. **New series is uploaded** and published
3. **Movie is updated** from unpublished to published

## User Preferences

Users can control email notifications:
- **Default**: Email notifications are ON
- **Can be toggled** in settings (API endpoint ready)
- **Respected** when sending bulk notifications

## Migration Required

After pulling this code, run:
```bash
npx prisma migrate dev --name add_notifications
```

Or if using production:
```bash
npx prisma migrate deploy
```

## Future Enhancements

Potential improvements:
- [ ] Push notifications (browser/device)
- [ ] Notification preferences UI in settings page
- [ ] Notification categories (movies, series, promotions)
- [ ] Batch email sending with rate limiting
- [ ] Notification digest (daily/weekly summary)
- [ ] Real-time updates with WebSockets

## Testing

To test notifications:
1. Create a new movie in admin panel
2. Set `isPublished: true`
3. Check notifications appear in header
4. Verify email is sent (if user has emailNotifications: true)

## Notes

- Notifications are created asynchronously (won't block content creation)
- Email sending is optional and respects user preferences
- Only verified users receive notifications
- Notifications are stored in database (persistent)
- UI polls for new notifications every 30 seconds
