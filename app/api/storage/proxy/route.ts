import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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

    // Get the file from storage
    const s3Client = (storageService as any).client as S3Client | null
    const config = (storageService as any).config as any

    if (!s3Client || !config) {
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 500 }
      )
    }

    try {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: decodedKey,
      })

      const response = await s3Client.send(command)

      if (!response.Body) {
        return NextResponse.json(
          { message: 'File not found' },
          { status: 404 }
        )
      }

      // Convert stream to buffer
      // AWS SDK v3 returns a Readable stream
      const stream = response.Body as any
      
      // Convert stream to buffer
      const chunks: Buffer[] = []
      
      // Handle Readable stream (Node.js)
      if (stream && typeof stream.on === 'function') {
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream.on('end', () => resolve(Buffer.concat(chunks)))
          stream.on('error', reject)
        })
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': response.ContentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Disposition': `inline; filename="${decodedKey.split('/').pop()}"`,
          },
        })
      } else {
        // Fallback: try to read as array buffer
        const arrayBuffer = await stream.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': response.ContentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Disposition': `inline; filename="${decodedKey.split('/').pop()}"`,
          },
        })
      }
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
