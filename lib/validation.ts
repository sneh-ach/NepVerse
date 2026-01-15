// Input validation schemas using Zod
import { z } from 'zod'

// Auth validation
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  phone: z.union([
    z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    z.literal('')
  ]).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Profile validation
export const profileCreateSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(50, 'Profile name must be 50 characters or less'),
  avatar: z.string().url('Invalid avatar URL').max(2000, 'Avatar URL too long').optional(),
  avatarType: z.enum(['emoji', 'image', 'default']).optional(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits').optional(),
  isKidsProfile: z.boolean().optional(),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Profile name cannot be empty').max(50, 'Profile name must be 50 characters or less').optional(),
  avatar: z.string().url('Invalid avatar URL').max(2000, 'Avatar URL too long').optional(),
  avatarType: z.enum(['emoji', 'image', 'default']).optional(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits').nullable().optional(),
  isKidsProfile: z.boolean().optional(),
})

// Content validation
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment too long'),
})

// Subscription validation
export const subscriptionCreateSchema = z.object({
  planId: z.enum(['basic', 'standard', 'premium']),
  billingCycle: z.enum(['monthly', 'yearly']),
})

// Watch history validation
export const watchHistorySchema = z.object({
  movieId: z.string().optional(),
  seriesId: z.string().optional(),
  episodeId: z.string().optional(),
  progress: z.number().min(0).max(100),
  currentTime: z.number().min(0),
  duration: z.number().min(0),
  completed: z.boolean().optional(),
}).refine((data) => data.movieId || data.seriesId || data.episodeId, {
  message: 'Either movieId, seriesId, or episodeId is required',
})

// Watchlist validation
export const watchListSchema = z.object({
  movieId: z.string().optional(),
  seriesId: z.string().optional(),
}).refine((data) => data.movieId || data.seriesId, {
  message: 'Either movieId or seriesId is required',
})

// Helper function to validate and parse
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Validation failed' }
  }
}


