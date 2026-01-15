'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ContentModerationPanel } from '@/components/admin/ContentModerationPanel'
import { Flag, AlertCircle } from 'lucide-react'

export default function AdminModerationPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // TEMPORARY: Allow access for testing - remove in production
    if (user && (user as any).role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  // TEMPORARY: Allow access for testing - remove in production
  if (!user || (user as any).role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Flag className="mr-3" size={32} />
            Content Moderation
          </h1>
          <p className="text-gray-400">Review and manage flagged content</p>
        </div>

        <ContentModerationPanel />
      </div>
    </div>
  )
}

