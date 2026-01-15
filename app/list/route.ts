import { NextResponse } from 'next/server'

// Handle /list requests gracefully (browser prefetch)
export async function GET() {
  return NextResponse.json(
    { message: 'Use /api/watch/list for watchlist API' },
    { status: 404 }
  )
}
