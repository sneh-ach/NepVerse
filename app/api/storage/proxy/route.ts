import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic'

/**
 * GET /api/storage/proxy
 * Proxy endpoint to serve files from R2/S3 storage
 * 
 * @param searchParams.key - The storage key/path to the file
 * @returns The file content with appropriate headers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { message: 'Key parameter is required' },
        { status: 400 }
      )
    }

    // Decode the key in case it's URL encoded
    const decodedKey = decodeURIComponent(key)

    // Check if storage is configured
    if (!storageService.isConfigured()) {
      console.error('Storage proxy: Storage not configured')
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 500 }
      )
    }

    try {
      // Use the public method to get the file
      const response = await storageService.getFile(decodedKey)

      if (!response.Body) {
        return NextResponse.json(
          { message: 'File not found' },
          { status: 404 }
        )
      }

      // Convert stream to buffer
      // AWS SDK v3 returns a Readable stream
      const stream = response.Body as any
      
      let buffer: Buffer
      
      // Handle Readable stream (Node.js) - AWS SDK v3 returns Readable
      if (stream && typeof stream.on === 'function') {
        buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = []
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream.on('end', () => resolve(Buffer.concat(chunks)))
          stream.on('error', reject)
        })
      } else if (stream && typeof stream.arrayBuffer === 'function') {
        // Handle ReadableStream or Blob
        const arrayBuffer = await stream.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else if (stream instanceof Buffer) {
        buffer = stream
      } else if (stream instanceof Uint8Array) {
        buffer = Buffer.from(stream)
      } else {
        // Fallback: try to convert to buffer
        try {
          buffer = Buffer.from(stream as any)
        } catch (e) {
          return NextResponse.json(
            { message: 'Failed to read file stream' },
            { status: 500 }
          )
        }
      }
      
      // Determine content type from file extension if not provided
      let contentType = response.ContentType || 'application/octet-stream'
      if (!response.ContentType) {
        const ext = decodedKey.split('.').pop()?.toLowerCase()
        const contentTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          mp4: 'video/mp4',
          webm: 'video/webm',
        }
        if (ext && contentTypes[ext]) {
          contentType = contentTypes[ext]
        }
      }
      
      // Convert buffer to Uint8Array for NextResponse
      const uint8Array = new Uint8Array(buffer)
      
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Disposition': `inline; filename="${decodedKey.split('/').pop()}"`,
        },
      })
    } catch (error: any) {
      // Handle S3/R2 errors
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return NextResponse.json(
          { message: 'File not found' },
          { status: 404 }
        )
      }

      console.error('Storage proxy error:', error)
      return NextResponse.json(
        { message: 'Failed to retrieve file', error: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Storage proxy error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
