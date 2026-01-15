'use client'

import { WifiOff, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <WifiOff size={64} className="text-gray-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">You're Offline</h1>
        <p className="text-gray-400 mb-8">
          It looks like you're not connected to the internet. Please check your connection and try again.
        </p>
        <Link href="/">
          <Button variant="primary">
            <Home size={18} className="mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}


