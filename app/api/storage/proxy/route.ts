import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { apiRateLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleError, logError } from '@/lib/errorHandler'

/**
 * GET /api/storage/proxy?key=<file-key>
 * Proxy endpoint to serve R2 files
 * 
 * This endpoint streams R2 files directly to the client
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = await apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetTime / 1000)) } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { message: 'Key parameter is required' },
        { status: 400 }
      )
    }

    if (!storageService.isConfigured()) {
      return NextResponse.json(
        { message: 'Storage not configured' },
        { status: 503 }
      )
    }

    // Get R2 config
    const accountId = process.env.R2_ACCOUNT_ID
    const bucket = process.env.R2_BUCKET
    const accessKey = process.env.R2_ACCESS_KEY_ID
    const secretKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !bucket || !accessKey || !secretKey) {
      return NextResponse.json(
        { message: 'R2 not configured' },
        { status: 503 }
      )
    }

    // Create S3 client for R2
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    })

    // Get object from R2
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const response = await client.send(command)

    if (!response.Body) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

    // Stream the file
    const stream = response.Body as any
    const chunks: Uint8Array[] = []
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)
    const contentType = response.ContentType || 'application/octet-stream'

    // Return file with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }
    logError(error, 'Storage proxy')
    const errorInfo = handleError(error)
    return NextResponse.json(
      { message: errorInfo.message, code: errorInfo.code },
      { status: errorInfo.statusCode }
    )
  }
}
