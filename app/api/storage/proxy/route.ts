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
    let decodedKey: string
    try {
      decodedKey = decodeURIComponent(key)
    } catch (decodeError: any) {
      console.error('Failed to decode key:', { key, error: decodeError.message })
      return NextResponse.json(
        { message: 'Invalid key encoding', key },
        { status: 400 }
      )
    }

    // Normalize the key to handle any special Unicode characters that might cause issues
    // This is important for files that were uploaded before sanitization was added
    // Replace non-breaking spaces and other problematic Unicode characters
    const normalizedKey = decodedKey
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/[\u00A0\u2000-\u200F]/g, ' ') // Replace non-breaking spaces and various space characters with regular space
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim()
    
    // Use normalized key for the actual request
    const keyToUse = normalizedKey

    // Check if storage is configured
    if (!storageService.isConfigured()) {
      console.error('Storage proxy: Storage not configured')
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 500 }
      )
    }

    try {
      // Try with normalized key first, fallback to original if needed
      let response
      try {
        response = await storageService.getFile(keyToUse)
      } catch (normalizedError: any) {
        // If normalized key fails, try original key (for backwards compatibility)
        if (normalizedKey !== decodedKey) {
          console.warn(`Normalized key failed, trying original: ${decodedKey}`, normalizedError.message)
          try {
            response = await storageService.getFile(decodedKey)
          } catch (originalError: any) {
            throw originalError // Throw the original error if both fail
          }
        } else {
          throw normalizedError
        }
      }

      if (!response.Body) {
        console.error(`Storage proxy: Response body is null for key: ${decodedKey}`)
        return NextResponse.json(
          { message: 'File not found or empty', key: decodedKey },
          { status: 404 }
        )
      }

      // Log response metadata for debugging
      console.log('Storage proxy response:', {
        originalKey: decodedKey,
        normalizedKey: keyToUse,
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        bodyType: typeof response.Body,
        bodyConstructor: response.Body?.constructor?.name,
      })

      // Convert stream to buffer
      // AWS SDK v3 returns a Readable stream in Node.js
      // The recommended approach is to use transformToByteArray() if available
      const stream = response.Body as any
      
      let buffer: Buffer
      
      try {
        // Method 1: Use AWS SDK's built-in transformToByteArray() (recommended)
        if (stream && typeof stream.transformToByteArray === 'function') {
          const bytes = await stream.transformToByteArray()
          buffer = Buffer.from(bytes)
        }
        // Method 2: Node.js Readable stream (most common fallback)
        else if (stream && typeof stream.on === 'function') {
          buffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            let hasResolved = false
            
            const cleanup = () => {
              if (hasResolved) return
              hasResolved = true
              stream.removeAllListeners?.()
            }
            
            stream.on('data', (chunk: Buffer) => {
              chunks.push(chunk)
            })
            
            stream.on('end', () => {
              if (!hasResolved) {
                cleanup()
                resolve(Buffer.concat(chunks))
              }
            })
            
            stream.on('error', (err: Error) => {
              if (!hasResolved) {
                cleanup()
                console.error('Stream error:', err)
                reject(err)
              }
            })
            
            // Set a timeout to prevent hanging
            const timeout = setTimeout(() => {
              if (!hasResolved && chunks.length === 0) {
                cleanup()
                reject(new Error('Stream timeout - no data received'))
              }
            }, 30000) // 30 second timeout
            
            // Clear timeout when done
            stream.once('end', () => clearTimeout(timeout))
            stream.once('error', () => clearTimeout(timeout))
          })
        } 
        // Method 3: ReadableStream (browser/edge runtime)
        else if (stream && typeof stream.getReader === 'function') {
          const reader = stream.getReader()
          const chunks: Uint8Array[] = []
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) chunks.push(value)
          }
          
          // Combine all chunks
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunks) {
            combined.set(chunk, offset)
            offset += chunk.length
          }
          buffer = Buffer.from(combined)
        }
        // Method 4: arrayBuffer method
        else if (stream && typeof stream.arrayBuffer === 'function') {
          const arrayBuffer = await stream.arrayBuffer()
          buffer = Buffer.from(arrayBuffer)
        }
        // Method 5: Already a Buffer
        else if (stream instanceof Buffer) {
          buffer = stream
        }
        // Method 6: Uint8Array
        else if (stream instanceof Uint8Array) {
          buffer = Buffer.from(stream)
        }
        // Method 7: Try to transform to web stream and read
        else if (stream && typeof stream.transformToWebStream === 'function') {
          const webStream = stream.transformToWebStream()
          const reader = webStream.getReader()
          const chunks: Uint8Array[] = []
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) chunks.push(value)
          }
          
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunks) {
            combined.set(chunk, offset)
            offset += chunk.length
          }
          buffer = Buffer.from(combined)
        }
        // Fallback: try to convert directly
        else {
          console.warn('Unknown stream type, attempting direct conversion:', {
            type: typeof stream,
            constructor: stream?.constructor?.name,
            hasOn: typeof stream?.on,
            hasGetReader: typeof stream?.getReader,
            hasArrayBuffer: typeof stream?.arrayBuffer,
          })
          buffer = Buffer.from(stream as any)
        }
      } catch (streamError: any) {
        console.error('Stream conversion error:', {
          message: streamError.message,
          originalKey: decodedKey,
          normalizedKey: keyToUse,
          streamType: typeof stream,
          streamConstructor: stream?.constructor?.name,
          hasOn: typeof stream?.on,
          hasGetReader: typeof stream?.getReader,
          hasArrayBuffer: typeof stream?.arrayBuffer,
          hasTransformToWebStream: typeof stream?.transformToWebStream,
          stack: streamError.stack,
        })
        return NextResponse.json(
          { message: 'Failed to read file stream', error: streamError.message, originalKey: decodedKey, normalizedKey: keyToUse },
          { status: 500 }
        )
      }
      
      // Determine content type from file extension if not provided
      let contentType = response.ContentType || 'application/octet-stream'
      if (!response.ContentType) {
        const ext = keyToUse.split('.').pop()?.toLowerCase()
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
          'Content-Disposition': `inline; filename="${keyToUse.split('/').pop()}"`,
        },
      })
    } catch (error: any) {
      // Handle S3/R2 errors
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        console.error(`Storage proxy: File not found - originalKey: ${decodedKey}, normalizedKey: ${keyToUse}`)
        return NextResponse.json(
          { message: 'File not found', originalKey: decodedKey, normalizedKey: keyToUse },
          { status: 404 }
        )
      }

      console.error('Storage proxy error:', {
        message: error.message,
        name: error.name,
        originalKey: decodedKey,
        normalizedKey: keyToUse,
        stack: error.stack,
        metadata: error.$metadata,
      })
      return NextResponse.json(
        { message: 'Failed to retrieve file', error: error.message, originalKey: decodedKey, normalizedKey: keyToUse },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Storage proxy outer error:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
