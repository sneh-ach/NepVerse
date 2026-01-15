'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function GrantAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isGranting, setIsGranting] = useState(false)

  const handleGrantAdmin = async () => {
    setIsGranting(true)
    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to grant admin access')
      }

      toast.success('Admin access granted! Redirecting...')
      
      // Refresh user data
      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant admin access')
      console.error('Error:', error)
    } finally {
      setIsGranting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card p-8 rounded-lg border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">Grant Admin Access</h1>
        <p className="text-gray-400 mb-6">
          Click the button below to grant yourself admin access.
        </p>
        
        {user && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-400">Current User:</p>
            <p className="text-white font-semibold">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Role: {user.role || 'USER'}
            </p>
          </div>
        )}

        <Button
          onClick={handleGrantAdmin}
          variant="primary"
          className="w-full"
          isLoading={isGranting}
        >
          {isGranting ? 'Granting Access...' : 'Grant Admin Access'}
        </Button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          After granting access, you'll be redirected to the admin dashboard.
        </p>
      </div>
    </div>
  )
}


