import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { verifyToken, extractTokenFromHeader } from './auth'

/**
 * Get the current profile ID from request
 * Checks cookie first, then falls back to first profile for user
 */
export async function getProfileId(request: NextRequest): Promise<string | null> {
  try {
    // Get userId first
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader) || 
                 request.cookies.get('token')?.value || 
                 request.cookies.get('auth-token')?.value

    if (!token) return null

    const payload = verifyToken(token)
    if (!payload?.userId) return null

    const userId = payload.userId

    // Get current profile from cookie
    const currentProfileId = request.cookies.get('current-profile-id')?.value

    if (currentProfileId) {
      const profile = await prisma.userProfile.findUnique({
        where: { id: currentProfileId },
      })

      if (profile && profile.userId === userId) {
        return profile.id
      }
    }

    // If no current profile set, get the first profile for this user
    const firstProfile = await prisma.userProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return firstProfile?.id || null
  } catch (error) {
    console.error('Get profile ID error:', error)
    return null
  }
}
