'use client'

import { useState, useEffect } from 'react'
import { Settings, Type, Eye, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
}

export function AccessibilityControls() {
  const [showModal, setShowModal] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
  })

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('accessibility-settings')
    if (saved) {
      setSettings(JSON.parse(saved))
      applySettings(JSON.parse(saved))
    }
  }, [])

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement

    // Font size
    root.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    }[newSettings.fontSize]

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s')
    } else {
      root.style.removeProperty('--animation-duration')
    }

    // Screen reader optimizations
    if (newSettings.screenReader) {
      root.setAttribute('aria-live', 'polite')
    } else {
      root.removeAttribute('aria-live')
    }
  }

  const handleSave = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings)
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings))
    applySettings(newSettings)
    setShowModal(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2"
        aria-label="Accessibility settings"
      >
        <Settings size={18} />
        <span>Accessibility</span>
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Accessibility Settings</h2>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="flex items-center space-x-2 text-white font-semibold mb-3">
                <Type size={18} />
                <span>Font Size</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSave({ ...settings, fontSize: size })}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      settings.fontSize === size
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => handleSave({ ...settings, highContrast: e.target.checked })}
                  className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Eye size={18} className="text-white" />
                  <span className="text-white font-semibold">High Contrast Mode</span>
                </div>
              </label>
            </div>

            {/* Reduced Motion */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => handleSave({ ...settings, reducedMotion: e.target.checked })}
                  className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Volume2 size={18} className="text-white" />
                  <span className="text-white font-semibold">Reduce Motion</span>
                </div>
              </label>
            </div>

            {/* Screen Reader */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.screenReader}
                  onChange={(e) => handleSave({ ...settings, screenReader: e.target.checked })}
                  className="w-5 h-5 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
                />
                <span className="text-white font-semibold">Screen Reader Optimizations</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}


