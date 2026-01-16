// Cloud storage abstraction for video and image uploads
// Supports AWS S3 and Cloudflare R2

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Sanitize filename to remove special characters that can cause issues with S3/R2
 * Replaces non-ASCII characters and special characters with safe alternatives
 */
function sanitizeFileName(fileName: string): string {
  // Remove or replace problematic Unicode characters
  // Replace non-breaking spaces and other invisible characters with regular spaces
  let sanitized = fileName
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ') // Replace non-breaking spaces and zero-width characters
    .replace(/[\u2000-\u200F]/g, ' ') // Replace various space characters
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove control characters but keep printable Unicode
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
  
  // Replace remaining problematic characters with underscores
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
  
  // Ensure the filename is not empty
  if (!sanitized || sanitized.trim().length === 0) {
    sanitized = 'file'
  }
  
  return sanitized
}

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
    // Helper to get env var and strip quotes if present
    const getEnv = (key: string): string | undefined => {
      const value = process.env[key]
      if (!value) return undefined
      // Strip surrounding quotes if present
      return value.replace(/^["']|["']$/g, '')
    }
    
    // Check for S3 or R2 configuration
    const hasS3 = !!getEnv('S3_ACCESS_KEY_ID') && !!getEnv('S3_SECRET_ACCESS_KEY')
    const hasR2 = !!getEnv('R2_ACCOUNT_ID') && !!getEnv('R2_ACCESS_KEY_ID')
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] Initializing storage service...')
      console.log('[Storage] Has S3:', hasS3)
      console.log('[Storage] Has R2:', hasR2, {
        accountId: !!getEnv('R2_ACCOUNT_ID'),
        accessKey: !!getEnv('R2_ACCESS_KEY_ID'),
        secretKey: !!getEnv('R2_SECRET_ACCESS_KEY'),
        bucket: !!getEnv('R2_BUCKET'),
      })
    }
    
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
      console.warn('[Storage] Storage provider not configured')
      console.warn('[Storage] Please set R2_* or S3_* environment variables')
      return
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] Using provider:', provider)
    }

    if (provider === 's3') {
      const getEnv = (key: string, fallback: string = ''): string => {
        const value = process.env[key] || fallback
        return value.replace(/^["']|["']$/g, '') // Strip quotes
      }
      
      this.config = {
        provider: 's3',
        endpoint: '', // S3 uses default endpoints
        bucket: getEnv('S3_BUCKET', getEnv('STORAGE_BUCKET')),
        accessKey: getEnv('S3_ACCESS_KEY_ID', getEnv('STORAGE_ACCESS_KEY')),
        secretKey: getEnv('S3_SECRET_ACCESS_KEY', getEnv('STORAGE_SECRET_KEY')),
        region: getEnv('S3_REGION', getEnv('STORAGE_REGION', 'us-east-1')),
      }
    } else if (provider === 'r2') {
      // R2 uses S3-compatible API but needs custom endpoint
      const getEnv = (key: string, fallback: string = ''): string => {
        const value = process.env[key] || fallback
        return value.replace(/^["']|["']$/g, '') // Strip quotes
      }
      
      const accountId = getEnv('R2_ACCOUNT_ID')
      this.config = {
        provider: 'r2',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        bucket: getEnv('R2_BUCKET', getEnv('STORAGE_BUCKET')),
        accessKey: getEnv('R2_ACCESS_KEY_ID', getEnv('STORAGE_ACCESS_KEY')),
        secretKey: getEnv('R2_SECRET_ACCESS_KEY', getEnv('STORAGE_SECRET_KEY')),
        region: 'auto', // R2 uses 'auto' region
      }
    }

    // Initialize S3 client (works for both S3 and R2)
    if (!this.config) {
      throw new Error('Storage configuration is not available')
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] Initializing S3 client with config:', {
        provider: this.config.provider,
        bucket: this.config.bucket,
        endpoint: this.config.endpoint || 'default',
        region: this.config.region,
        hasAccessKey: !!this.config.accessKey,
        hasSecretKey: !!this.config.secretKey,
      })
    }
    
    this.client = new S3Client({
      region: this.config.region || 'us-east-1',
      endpoint: this.config.provider === 'r2' ? (this.config.endpoint || undefined) : undefined,
      credentials: {
        accessKeyId: this.config.accessKey || '',
        secretAccessKey: this.config.secretKey || '',
      },
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] Storage service initialized successfully')
    }
  }

  async upload(options: UploadOptions): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('Storage not configured. Please set STORAGE_PROVIDER and credentials.')
    }

    // Sanitize the filename to remove special characters
    const sanitizedFileName = sanitizeFileName(options.fileName)
    
    const key = options.folder 
      ? `${options.folder}/${sanitizedFileName}`
      : sanitizedFileName

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
    const configured = this.config !== null && this.client !== null
    if (!configured && process.env.NODE_ENV === 'development') {
      console.warn('[Storage] Storage service is not configured')
      console.warn('[Storage] Client:', !!this.client, 'Config:', !!this.config)
      console.warn('[Storage] R2_ACCOUNT_ID:', !!process.env.R2_ACCOUNT_ID)
      console.warn('[Storage] R2_ACCESS_KEY_ID:', !!process.env.R2_ACCESS_KEY_ID)
      console.warn('[Storage] R2_BUCKET:', !!process.env.R2_BUCKET)
    }
    return configured
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
