// Cloud storage abstraction for video and image uploads
// Supports AWS S3 and Cloudflare R2

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface UploadOptions {
  file: Buffer | Uint8Array
  fileName: string
  contentType: string
  folder?: string
}

interface StorageConfig {
  provider: 's3' | 'r2'
  endpoint: string
  bucket: string
  accessKey: string
  secretKey: string
  region: string
}

class StorageService {
  private config: StorageConfig | null = null
  private client: S3Client | null = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Check for S3 or R2 configuration
    const hasS3 = !!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY
    const hasR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID
    
    let provider: 's3' | 'r2' | undefined
    if (hasS3) {
      provider = 's3'
    } else if (hasR2) {
      provider = 'r2'
    } else {
      // Fallback to STORAGE_PROVIDER env var
      provider = process.env.STORAGE_PROVIDER as 's3' | 'r2' | undefined
    }

    if (!provider) {
      console.warn('Storage provider not configured')
      return
    }

    if (provider === 's3') {
      this.config = {
        provider: 's3',
        endpoint: '', // S3 uses default endpoints
        bucket: process.env.S3_BUCKET || process.env.STORAGE_BUCKET || '',
        accessKey: process.env.S3_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY || '',
        secretKey: process.env.S3_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY || '',
        region: process.env.S3_REGION || process.env.STORAGE_REGION || 'us-east-1',
      }
    } else if (provider === 'r2') {
      // R2 uses S3-compatible API but needs custom endpoint
      const accountId = process.env.R2_ACCOUNT_ID || ''
      this.config = {
        provider: 'r2',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        bucket: process.env.R2_BUCKET || process.env.STORAGE_BUCKET || '',
        accessKey: process.env.R2_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY || '',
        secretKey: process.env.R2_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY || '',
        region: 'auto', // R2 uses 'auto' region
      }
    }

    // Initialize S3 client (works for both S3 and R2)
    if (!this.config) {
      throw new Error('Storage configuration is not available')
    }
    this.client = new S3Client({
      region: this.config.region || 'us-east-1',
      endpoint: this.config.provider === 'r2' ? (this.config.endpoint || undefined) : undefined,
      credentials: {
        accessKeyId: this.config.accessKey || '',
        secretAccessKey: this.config.secretKey || '',
      },
    })
  }

  async upload(options: UploadOptions): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('Storage not configured. Please set STORAGE_PROVIDER and credentials.')
    }

    const key = options.folder 
      ? `${options.folder}/${options.fileName}`
      : options.fileName

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: options.file,
      ContentType: options.contentType,
    })

    await this.client.send(command)

    // Return public URL
    // For R2, we need to use a proxy endpoint or custom domain
    // R2 doesn't support direct public URLs like S3
    if (this.config.provider === 'r2') {
      const cdnUrl = process.env.CDN_URL
      if (cdnUrl) {
        // Use custom domain if configured (recommended)
        return `${cdnUrl}/${key}`
      } else {
        // Use proxy endpoint to serve files
        // This ensures images are accessible even without public bucket
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return `${baseUrl}/api/storage/proxy?key=${encodeURIComponent(key)}`
      }
    } else {
      // S3 public URL
      const cdnUrl = process.env.CDN_URL || `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`
      return `${cdnUrl}/${key}`
    }
  }

  async getSignedUploadUrl(fileName: string, contentType: string, folder?: string): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('Storage not configured')
    }

    const key = folder ? `${folder}/${fileName}` : fileName

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
    })

    return getSignedUrl(this.client, command, { expiresIn: 3600 }) // 1 hour
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('Storage not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    return getSignedUrl(this.client, command, { expiresIn })
  }

  isConfigured(): boolean {
    return this.config !== null && this.client !== null
  }

  /**
   * Get a file from storage (for proxy endpoint)
   * Returns the GetObjectCommandOutput response
   */
  async getFile(key: string) {
    if (!this.client || !this.config) {
      throw new Error('Storage not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    return this.client.send(command)
  }

  /**
   * Get the storage configuration (for proxy endpoint)
   */
  getConfig() {
    return this.config
  }
}

export const storageService = new StorageService()
