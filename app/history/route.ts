import { NextResponse } from 'next/server'

// Handle /history requests gracefully (browser prefetch)
export async function GET() {
  return NextResponse.json(
    { message: 'Use /api/watch/history for watch history API' },
    { status: 404 }
  )
}
