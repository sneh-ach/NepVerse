import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { AuthenticationError, AuthorizationError } from './errorHandler'

// Validate JWT_SECRET is set (critical for production)
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  console.warn('⚠️  JWT_SECRET not set, using fallback. This is UNSAFE for production!')
}

const JWT_SECRET_FINAL = JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email?: string
  phone?: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET_FINAL, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET_FINAL) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Helper to get authenticated user from request
export async function getAuthUser(request: Request | { headers: Headers; cookies: { get: (name: string) => { value: string } | undefined } }): Promise<{ id: string; role: string; email: string | null } | null> {
  const authHeader = 'headers' in request ? request.headers.get('authorization') : null
  const token = extractTokenFromHeader(authHeader) || ('cookies' in request ? request.cookies.get('token')?.value : null)
  
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  const user = await prisma.user.findUnique({ 
    where: { id: payload.userId },
    select: { id: true, role: true, email: true }
  })
  
  return user
}

// Require authenticated user
export async function requireAuth(request: Request | { headers: Headers; cookies: { get: (name: string) => { value: string } | undefined } }): Promise<{ id: string; role: string; email: string | null }> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new AuthenticationError('Authentication required')
  }
  return user
}

// Require admin user
export async function requireAdmin(request: Request | { headers: Headers; cookies: { get: (name: string) => { value: string } | undefined } }): Promise<{ id: string; role: string; email: string | null }> {
  const user = await requireAuth(request)
  if (user.role !== 'ADMIN') {
    throw new AuthorizationError('Admin access required')
  }
  return user
}

// Helper to get user ID from request (returns null if not authenticated)
export async function getUserId(request: Request | { headers: Headers; cookies: { get: (name: string) => { value: string } | undefined } }): Promise<string | null> {
  const user = await getAuthUser(request)
  return user?.id || null
}




