import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklMovieToApp } from '@/lib/simkl'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const simklId = parseInt(params.id)
    
    if (isNaN(simklId)) {
      return NextResponse.json(
        { message: 'Invalid movie ID' },
        { status: 400 }
      )
    }

    const movie = await simklClient.getMovie(simklId)
    const converted = convertSimklMovieToApp(movie)

    return NextResponse.json(converted)
  } catch (error: any) {
    console.error('Simkl get movie error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch movie' },
      { status: 500 }
    )
  }
}




