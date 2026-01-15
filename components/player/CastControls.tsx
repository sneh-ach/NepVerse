'use client'

import { useState, useEffect } from 'react'
import { Cast, Airplay, Wifi, X } from 'lucide-react'
import { castingService, CastDevice } from '@/lib/casting'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface CastControlsProps {
  mediaUrl: string
  metadata: {
    title: string
    description?: string
    posterUrl?: string
    duration?: number
  }
  onCastStart?: () => void
  onCastStop?: () => void
}

export function CastControls({
  mediaUrl,
  metadata,
  onCastStart,
  onCastStop,
}: CastControlsProps) {
  const [showModal, setShowModal] = useState(false)
  const [devices, setDevices] = useState<CastDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [currentCast, setCurrentCast] = useState<CastDevice | null>(null)
  const [isCasting, setIsCasting] = useState(false)

  useEffect(() => {
    // Check for existing cast session
    const cast = castingService.getCurrentCast()
    if (cast) {
      setCurrentCast(cast)
      setIsCasting(true)
    }
  }, [])

  const scanDevices = async () => {
    setIsScanning(true)
    try {
      const foundDevices = await castingService.scanDevices()
      setDevices(foundDevices)
    } catch (error) {
      toast.error('Failed to scan for devices')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCast = async (device: CastDevice) => {
    try {
      let success = false

      switch (device.type) {
        case 'chromecast':
          success = await castingService.castToChromecast(mediaUrl, metadata)
          break
        case 'airplay':
          success = await castingService.castToAirPlay(mediaUrl)
          break
        case 'dlna':
          const { dlnaService } = await import('@/lib/dlna')
          success = await dlnaService.castToDevice(device.id, mediaUrl, metadata)
          break
      }

      if (success) {
        setCurrentCast(device)
        setIsCasting(true)
        setShowModal(false)
        onCastStart?.()
        toast.success(`Casting to ${device.name}`)
      } else {
        toast.error('Failed to cast')
      }
    } catch (error) {
      toast.error('Casting failed')
    }
  }

  const handleStopCast = () => {
    castingService.stopCasting()
    setCurrentCast(null)
    setIsCasting(false)
    onCastStop?.()
    toast.success('Casting stopped')
  }

  return (
    <>
      <div className="flex items-center">
        {isCasting && currentCast ? (
          <div className="flex items-center space-x-2 bg-primary/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/50 shadow-lg">
            <Cast size={20} className="text-primary" fill="currentColor" />
            <span className="text-white text-sm font-semibold">{currentCast.name}</span>
            <button
              onClick={handleStopCast}
              className="text-gray-300 hover:text-white transition-colors ml-2 p-1 hover:bg-white/10 rounded"
              aria-label="Stop casting"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowModal(true)
              scanDevices()
            }}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-md hover:from-primary/30 hover:to-primary/20 px-2.5 sm:px-4 py-2 rounded-lg border-2 border-primary/40 hover:border-primary transition-all hover:scale-105 active:scale-100 shadow-xl hover:shadow-2xl hover:shadow-primary/50 text-white font-bold min-w-[80px] sm:min-w-[100px] justify-center transform-gpu group relative overflow-hidden"
            aria-label="Cast to device"
            style={{ 
              boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
              maxWidth: '100%'
            }}
          >
            <span className="absolute inset-0 bg-white/20 rounded-lg scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
            <Cast size={18} className="text-primary fill-current relative z-10 group-hover:scale-125 transition-transform duration-300 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold relative z-10 truncate">Cast</span>
          </button>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Cast to Device</h2>

          <div className="space-y-4">
            {/* Scan Button */}
            <Button
              variant="outline"
              onClick={scanDevices}
              isLoading={isScanning}
              className="w-full group/btn font-bold backdrop-blur-md"
            >
              <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">
                {isScanning ? 'Scanning...' : 'Scan for Devices'}
              </span>
            </Button>

            {/* Device List */}
            {devices.length === 0 && !isScanning && (
              <div className="text-center py-8 text-gray-400">
                <Wifi size={48} className="mx-auto mb-4 opacity-50" />
                <p>No devices found</p>
                <p className="text-sm mt-2">Make sure your device is on the same network</p>
              </div>
            )}

            <div className="space-y-2">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleCast(device)}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 relative z-10">
                    {device.type === 'chromecast' && <Cast size={22} className="text-primary group-hover:scale-125 transition-transform duration-300" />}
                    {device.type === 'airplay' && <Airplay size={22} className="text-primary group-hover:scale-125 transition-transform duration-300" />}
                    {device.type === 'dlna' && <Wifi size={22} className="text-primary group-hover:scale-125 transition-transform duration-300" />}
                    <div className="text-left">
                      <p className="text-white font-bold group-hover:text-primary transition-colors duration-300">{device.name}</p>
                      <p className="text-gray-400 text-sm capitalize">{device.type}</p>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full relative z-10 group-hover:scale-125 transition-transform duration-300 ${
                      device.status === 'available'
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : device.status === 'connected'
                        ? 'bg-primary shadow-lg shadow-primary/50'
                        : 'bg-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400">
              <p className="mb-2">
                <strong className="text-white">Chromecast:</strong> Available on Chrome browser
              </p>
              <p className="mb-2">
                <strong className="text-white">AirPlay:</strong> Available on Safari/iOS
              </p>
              <p>
                <strong className="text-white">DLNA:</strong> Coming soon
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

