import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Clear the auth cookie
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  // Clear both possible cookie names
  response.cookies.delete('token')
  response.cookies.delete('auth-token')
  
  return response
}

