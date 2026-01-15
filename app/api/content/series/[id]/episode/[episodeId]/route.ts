import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; episodeId: string } }
) {
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: params.episodeId },
    })

    const series = await prisma.series.findUnique({
      where: { id: params.id },
    })

    if (!episode || !series || !episode.isPublished || !series.isPublished) {
      return NextResponse.json(
        { message: 'Episode not found' },
        { status: 404 }
      )
    }

    // Get next episode
    const nextEpisode = await prisma.episode.findFirst({
      where: {
        seriesId: params.id,
        episodeNumber: { gt: episode.episodeNumber },
        isPublished: true,
      },
      orderBy: {
        episodeNumber: 'asc',
      },
    })

    return NextResponse.json({
      episode,
      series,
      nextEpisode,
    })
  } catch (error) {
    console.error('Get episode error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}




