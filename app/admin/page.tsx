'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Film, Tv, Users, BarChart3, Upload } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState({
    movies: 0,
    series: 0,
    users: 0,
    views: 0,
  })

  useEffect(() => {
    // TEMPORARY: Allow access for testing - remove in production
    if (!loading && !user) {
      router.push('/login?redirect=/admin')
      return
    }
    if (user && (user as any).role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Fetch admin stats
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(setStats)
      .catch((error) => {
        console.error('Error fetching admin stats:', error)
        // Set default stats on error
        setStats({
          movies: 0,
          series: 0,
          users: 0,
          views: 0,
        })
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage content, users, and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Movies</h3>
              <Film size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.movies}</p>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Series</h3>
              <Tv size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.series}</p>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Users</h3>
              <Users size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.users}</p>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Views</h3>
              <BarChart3 size={24} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.views.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/content"
            className="bg-card p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <Film size={32} className="text-primary mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Content Management</h3>
            <p className="text-gray-400 text-sm">Manage movies, series, and upload content</p>
          </Link>

          <Link
            href="/admin/content?tab=upload"
            className="bg-card p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <Upload size={32} className="text-primary mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Upload Content</h3>
            <p className="text-gray-400 text-sm">Upload new movies or series with files</p>
          </Link>

          <Link
            href="/admin/content?tab=series"
            className="bg-card p-6 rounded-lg hover:bg-card-hover transition-colors"
          >
            <Tv size={32} className="text-primary mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Manage Series</h3>
            <p className="text-gray-400 text-sm">Add, edit, or remove series and episodes</p>
          </Link>
        </div>
      </div>
    </div>
  )
}



