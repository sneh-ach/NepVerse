import { NextRequest, NextResponse } from 'next/server'
import { simklClient, convertSimklShowToApp } from '@/lib/simkl'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const simklId = parseInt(params.id)
    
    if (isNaN(simklId)) {
      return NextResponse.json(
        { message: 'Invalid show ID' },
        { status: 400 }
      )
    }

    const show = await simklClient.getShow(simklId)
    const converted = convertSimklShowToApp(show)

    return NextResponse.json(converted)
  } catch (error: any) {
    console.error('Simkl get show error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch show' },
      { status: 500 }
    )
  }
}




