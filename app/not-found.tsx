import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-lg p-8 text-center border border-gray-800">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search size={32} className="text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link href="/">
            <Button variant="primary" className="w-full">
              <Home size={16} className="mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/browse">
            <Button variant="outline" className="w-full">
              <Search size={16} className="mr-2" />
              Browse Content
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}


