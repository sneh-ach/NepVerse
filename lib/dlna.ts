// DLNA (Digital Living Network Alliance) service
// For casting to DLNA-compatible devices (Smart TVs, media players, etc.)

export interface DLNADevice {
  id: string
  name: string
  location: string
  deviceType: string
  manufacturer: string
  model: string
}

class DLNAService {
  private devices: DLNADevice[] = []
  private discoveryEndpoint: string

  constructor() {
    // Backend endpoint for DLNA discovery
    // Set NEXT_PUBLIC_DLNA_ENDPOINT in .env
    this.discoveryEndpoint = process.env.NEXT_PUBLIC_DLNA_ENDPOINT || '/api/dlna'
  }

  // Scan for DLNA devices (requires backend service)
  async scanDevices(): Promise<DLNADevice[]> {
    try {
      const response = await fetch(`${this.discoveryEndpoint}/devices`)
      if (!response.ok) {
        throw new Error('Failed to scan DLNA devices')
      }
      const devices = await response.json()
      this.devices = devices
      return devices
    } catch (error) {
      console.error('DLNA scan error:', error)
      return []
    }
  }

  // Cast media to DLNA device
  async castToDevice(deviceId: string, mediaUrl: string, metadata: {
    title: string
    description?: string
    posterUrl?: string
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.discoveryEndpoint}/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          mediaUrl,
          metadata,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('DLNA cast error:', error)
      return false
    }
  }

  // Stop casting
  async stopCasting(deviceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.discoveryEndpoint}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      return response.ok
    } catch (error) {
      console.error('DLNA stop error:', error)
      return false
    }
  }

  getDevices(): DLNADevice[] {
    return this.devices
  }
}

export const dlnaService = new DLNAService()


