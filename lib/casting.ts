// Casting utilities for Chromecast, AirPlay, and DLNA
// Supports multiple casting protocols

export interface CastDevice {
  id: string
  name: string
  type: 'chromecast' | 'airplay' | 'dlna'
  status: 'available' | 'connecting' | 'connected' | 'error'
}

class CastingService {
  private castDevices: CastDevice[] = []
  private currentCast: CastDevice | null = null
  private castSession: any = null

  // Initialize Chromecast
  async initializeChromecast(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      // Check if Chromecast API is available
      if (!(window as any).chrome?.cast) {
        // Load Chromecast API
        await this.loadChromecastAPI()
      }

      const cast = (window as any).chrome?.cast
      if (!cast) return false

      const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
      const apiConfig = new cast.ApiConfig(
        sessionRequest,
        () => {}, // session listener
        (availability: string) => {
          // availability listener
          if (availability === 'available') {
            this.scanChromecastDevices()
          }
        }
      )

      cast.initialize(apiConfig, () => {
        console.log('Chromecast initialized')
      }, (error: any) => {
        console.error('Chromecast initialization error:', error)
      })

      return true
    } catch (error) {
      console.error('Chromecast initialization failed:', error)
      return false
    }
  }

  private async loadChromecastAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Chromecast API'))
      document.head.appendChild(script)
    })
  }

  private scanChromecastDevices(): void {
    // Chromecast devices are discovered automatically by the API
    // This is handled by the cast framework
  }

  // Scan for AirPlay devices
  async scanAirPlayDevices(): Promise<CastDevice[]> {
    if (typeof window === 'undefined') return []

    // AirPlay is typically available on Safari/iOS
    // Check if WebKit presentation API is available
    if ((window as any).webkit?.presentation?.receiver) {
      // AirPlay receiver available
      return [{
        id: 'airplay-receiver',
        name: 'AirPlay Receiver',
        type: 'airplay',
        status: 'available',
      }]
    }

    return []
  }

  // Scan for DLNA devices
  async scanDLNADevices(): Promise<CastDevice[]> {
    if (typeof window === 'undefined') return []

    try {
      const { dlnaService } = await import('./dlna')
      const devices = await dlnaService.scanDevices()
      return devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: 'dlna' as const,
        status: 'available' as const,
      }))
    } catch (error) {
      console.error('DLNA scan error:', error)
      return []
    }
  }

  // Scan for all available devices
  async scanDevices(): Promise<CastDevice[]> {
    const devices: CastDevice[] = []

    // Scan Chromecast
    const chromecastAvailable = await this.initializeChromecast()
    if (chromecastAvailable) {
      // Chromecast devices are managed by the framework
    }

    // Scan AirPlay
    const airplayDevices = await this.scanAirPlayDevices()
    devices.push(...airplayDevices)

    // Scan DLNA
    const dlnaDevices = await this.scanDLNADevices()
    devices.push(...dlnaDevices)

    this.castDevices = devices
    return devices
  }

  // Cast to Chromecast
  async castToChromecast(mediaUrl: string, metadata: {
    title: string
    description?: string
    posterUrl?: string
    duration?: number
  }): Promise<boolean> {
    try {
      const cast = (window as any).chrome?.cast
      if (!cast) {
        throw new Error('Chromecast not available')
      }

      const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
      const apiConfig = new cast.ApiConfig(
        sessionRequest,
        (session: any) => {
          this.castSession = session
          this.loadMedia(session, mediaUrl, metadata)
        },
        () => {}
      )

      cast.initialize(apiConfig, () => {
        cast.requestSession((session: any) => {
          this.castSession = session
          this.loadMedia(session, mediaUrl, metadata)
        })
      })

      return true
    } catch (error) {
      console.error('Chromecast error:', error)
      return false
    }
  }

  private loadMedia(session: any, mediaUrl: string, metadata: any): void {
    const cast = (window as any).chrome?.cast
    const mediaInfo = new cast.media.MediaInfo(mediaUrl, 'video/mp4')
    mediaInfo.metadata = new cast.media.GenericMediaMetadata()
    mediaInfo.metadata.title = metadata.title
    mediaInfo.metadata.subtitle = metadata.description
    mediaInfo.metadata.images = metadata.posterUrl ? [new cast.media.Image(metadata.posterUrl)] : []

    const request = new cast.media.LoadRequest(mediaInfo)
    request.currentTime = 0

    session.loadMedia(request, () => {
      console.log('Media loaded on Chromecast')
    }, (error: any) => {
      console.error('Media load error:', error)
    })
  }

  // Cast to AirPlay
  async castToAirPlay(mediaUrl: string): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      // Use WebKit Presentation API for AirPlay
      const video = document.createElement('video')
      video.src = mediaUrl
      video.controls = true

      // Request AirPlay presentation
      if ((video as any).webkitShowPlaybackTargetPicker) {
        (video as any).webkitShowPlaybackTargetPicker()
        return true
      }

      return false
    } catch (error) {
      console.error('AirPlay error:', error)
      return false
    }
  }

  // Stop casting
  stopCasting(): void {
    if (this.castSession) {
      this.castSession.stop(() => {
        this.castSession = null
        this.currentCast = null
      })
    }
  }

  // Get current cast device
  getCurrentCast(): CastDevice | null {
    return this.currentCast
  }

  // Get available devices
  getDevices(): CastDevice[] {
    return this.castDevices
  }
}

export const castingService = new CastingService()

