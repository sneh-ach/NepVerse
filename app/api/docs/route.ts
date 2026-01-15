import { NextResponse } from 'next/server'

export async function GET() {
  const docs = {
    title: 'NepVerse API Documentation',
    version: '1.0.0',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    endpoints: {
      authentication: {
        'POST /api/auth/signup': {
          description: 'Register a new user',
          body: {
            email: 'string (required)',
            password: 'string (required, min 8 chars)',
            firstName: 'string (optional)',
            lastName: 'string (optional)',
          },
          response: {
            user: 'User object',
            token: 'JWT token',
          },
        },
        'POST /api/auth/login': {
          description: 'Login user',
          body: {
            email: 'string (required)',
            password: 'string (required)',
          },
          response: {
            user: 'User object',
            token: 'JWT token',
          },
        },
        'POST /api/auth/logout': {
          description: 'Logout user',
          response: { message: 'Logged out successfully' },
        },
        'GET /api/auth/me': {
          description: 'Get current user',
          response: { user: 'User object' },
        },
        'POST /api/auth/password-reset': {
          description: 'Request password reset',
          body: { email: 'string (required)' },
          response: { message: 'Password reset email sent' },
        },
        'POST /api/auth/reset-password': {
          description: 'Reset password with token',
          body: {
            token: 'string (required)',
            password: 'string (required)',
          },
          response: { message: 'Password reset successfully' },
        },
        'POST /api/auth/verify-email': {
          description: 'Verify email with token',
          body: { token: 'string (required)' },
          response: { message: 'Email verified successfully' },
        },
      },
      content: {
        'GET /api/content/movie/[id]': {
          description: 'Get movie details',
          response: { movie: 'Movie object' },
        },
        'GET /api/content/series/[id]': {
          description: 'Get series details',
          response: { series: 'Series object' },
        },
        'GET /api/search': {
          description: 'Search content',
          query: {
            q: 'string (required)',
            type: 'movie | series (optional)',
            genre: 'string (optional)',
            year: 'number (optional)',
          },
          response: { results: 'Array of content' },
        },
        'GET /api/search/suggestions': {
          description: 'Get search suggestions',
          query: { q: 'string (required)' },
          response: { suggestions: 'Array of strings' },
        },
        'GET /api/recommendations': {
          description: 'Get personalized recommendations',
          response: { recommendations: 'Array of content' },
        },
        'GET /api/content/[id]/recommendations': {
          description: 'Get content-specific recommendations',
          response: { recommendations: 'Array of content' },
        },
      },
      social: {
        'POST /api/social/follow': {
          description: 'Follow a user',
          body: { followingId: 'string (required)' },
          response: { message: 'Followed successfully' },
        },
        'DELETE /api/social/follow': {
          description: 'Unfollow a user',
          body: { followingId: 'string (required)' },
          response: { message: 'Unfollowed successfully' },
        },
        'GET /api/users/[id]/profile': {
          description: 'Get user profile',
          response: {
            user: 'User object',
            followersCount: 'number',
            followingCount: 'number',
            isFollowing: 'boolean',
          },
        },
      },
      comments: {
        'GET /api/content/[id]/comments': {
          description: 'Get comments for content',
          query: {
            type: 'movie | series (required)',
            limit: 'number (optional, default 50)',
            offset: 'number (optional, default 0)',
          },
          response: { comments: 'Array of comments' },
        },
        'POST /api/content/[id]/comments': {
          description: 'Post a comment',
          body: {
            content: 'string (required)',
            type: 'movie | series (required)',
            parentId: 'string (optional, for replies)',
          },
          response: { comment: 'Comment object' },
        },
        'POST /api/content/comments/[id]/like': {
          description: 'Like a comment',
          response: { comment: 'Comment object' },
        },
      },
      watchlist: {
        'GET /api/watchlist': {
          description: 'Get user watchlist',
          response: { watchlist: 'Array of content' },
        },
        'POST /api/watchlist': {
          description: 'Add to watchlist',
          body: {
            contentId: 'string (required)',
            contentType: 'movie | series (required)',
          },
          response: { message: 'Added to watchlist' },
        },
        'DELETE /api/watchlist': {
          description: 'Remove from watchlist',
          body: {
            contentId: 'string (required)',
            contentType: 'movie | series (required)',
          },
          response: { message: 'Removed from watchlist' },
        },
      },
      watchHistory: {
        'GET /api/watch-history': {
          description: 'Get watch history',
          response: { history: 'Array of watch history items' },
        },
        'POST /api/watch-history': {
          description: 'Add/update watch history',
          body: {
            contentId: 'string (required)',
            contentType: 'movie | series (required)',
            progress: 'number (0-100, required)',
            episodeId: 'string (optional, for series)',
          },
          response: { message: 'Watch history updated' },
        },
      },
      subscriptions: {
        'GET /api/subscriptions/me': {
          description: 'Get current subscription',
          response: { subscription: 'Subscription object' },
        },
        'POST /api/subscriptions': {
          description: 'Create subscription',
          body: {
            planId: 'string (required)',
            paymentMethod: 'string (required)',
          },
          response: { subscription: 'Subscription object' },
        },
        'POST /api/subscriptions/cancel': {
          description: 'Cancel subscription',
          response: { message: 'Subscription cancelled' },
        },
        'POST /api/subscriptions/resume': {
          description: 'Resume subscription',
          response: { message: 'Subscription resumed' },
        },
      },
      admin: {
        'GET /api/admin/analytics': {
          description: 'Get admin analytics',
          response: {
            totalUsers: 'number',
            totalContent: 'number',
            totalRevenue: 'number',
            activeSubscriptions: 'number',
          },
        },
        'POST /api/admin/content/upload': {
          description: 'Upload content file',
          body: 'multipart/form-data',
          response: { url: 'string' },
        },
        'GET /api/admin/content/movies': {
          description: 'List all movies',
          response: { movies: 'Array of movies' },
        },
        'POST /api/admin/content/movies': {
          description: 'Create movie',
          body: 'Movie object',
          response: { movie: 'Movie object' },
        },
        'GET /api/admin/content/movies/[id]': {
          description: 'Get movie',
          response: { movie: 'Movie object' },
        },
        'PUT /api/admin/content/movies/[id]': {
          description: 'Update movie',
          body: 'Movie object',
          response: { movie: 'Movie object' },
        },
        'DELETE /api/admin/content/movies/[id]': {
          description: 'Delete movie',
          response: { message: 'Movie deleted' },
        },
      },
      watchParty: {
        'POST /api/watch-party/create': {
          description: 'Create watch party',
          body: {
            contentId: 'string (required)',
            contentType: 'movie | series (required)',
          },
          response: { watchParty: 'WatchParty object' },
        },
        'POST /api/watch-party/[id]/join': {
          description: 'Join watch party',
          body: { code: 'string (required)' },
          response: { message: 'Joined watch party' },
        },
        'GET /api/watch-party/[id]': {
          description: 'Get watch party details',
          response: { watchParty: 'WatchParty object' },
        },
      },
      casting: {
        'GET /api/dlna/devices': {
          description: 'Discover DLNA devices',
          response: { devices: 'Array of devices' },
        },
        'POST /api/dlna/cast': {
          description: 'Cast to DLNA device',
          body: {
            deviceId: 'string (required)',
            videoUrl: 'string (required)',
          },
          response: { message: 'Casting started' },
        },
      },
    },
    authentication: {
      type: 'Bearer Token',
      description: 'Include Authorization header: Bearer <token>',
      note: 'Token is set as HTTP-only cookie on login',
    },
    rateLimiting: {
      description: 'API endpoints are rate-limited',
      limits: {
        auth: '5 requests per minute',
        api: '100 requests per minute',
        upload: '10 requests per minute',
      },
    },
  }

  return NextResponse.json(docs, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}


