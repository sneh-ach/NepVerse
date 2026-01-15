'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'

export default function TestSimklPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testTrending = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/simkl/trending?type=all&limit=5')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults({ type: 'trending', data })
    } catch (err: any) {
      setError(err.message)
      setResults({ type: 'trending', data: { movies: [], shows: [], message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  const testNepali = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/simkl/nepali')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults({ type: 'nepali', data })
    } catch (err: any) {
      setError(err.message)
      setResults({ type: 'nepali', data: { movies: [], shows: [], message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  const testPopularNepali = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/simkl/popular-nepali')
      const data = await res.json()
      setResults({ type: 'popular-nepali', data })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testCustomList = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try the specific list ID (14933)
      const res = await fetch('/api/simkl/list/14933')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults({ type: 'custom-list', data })
    } catch (err: any) {
      setError(err.message)
      setResults({ type: 'custom-list', data: { movies: [], shows: [], message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  const testSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/simkl/search?q=nepal&type=all')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults({ type: 'search', data })
    } catch (err: any) {
      setError(err.message)
      setResults({ type: 'search', data: { movies: [], shows: [], message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <h1 className="text-4xl font-bold text-white mb-2">Simkl API Test</h1>
        <p className="text-gray-400 mb-8">Test if Simkl API is working correctly</p>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={testTrending} isLoading={loading} variant="primary">
            Test Trending
          </Button>
          <Button onClick={testNepali} isLoading={loading} variant="primary">
            Test Nepali Content
          </Button>
          <Button onClick={testPopularNepali} isLoading={loading} variant="primary">
            Popular Nepali Movies
          </Button>
          <Button onClick={testCustomList} isLoading={loading} variant="primary">
            Custom List (Azmarine)
          </Button>
          <Button onClick={testSearch} isLoading={loading} variant="primary">
            Test Search
          </Button>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-500">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-white">{error}</p>
          </Card>
        )}

        {results && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Results: {results.type}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(results.data.movies || []).map((movie: any, index: number) => (
                <Card key={index} className="p-4">
                  {movie.posterUrl && (
                    <div className="relative aspect-[2/3] mb-4 rounded overflow-hidden">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-white font-semibold mb-2">{movie.title}</h3>
                  {movie.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-3">
                      {movie.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {movie.rating && <span>⭐ {movie.rating}</span>}
                    {movie.releaseDate && (
                      <span>{new Date(movie.releaseDate).getFullYear()}</span>
                    )}
                  </div>
                </Card>
              ))}

              {(results.data.shows || []).map((show: any, index: number) => (
                <Card key={index} className="p-4">
                  {show.posterUrl && (
                    <div className="relative aspect-[2/3] mb-4 rounded overflow-hidden">
                      <Image
                        src={show.posterUrl}
                        alt={show.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-white font-semibold mb-2">{show.title}</h3>
                  {show.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-3">
                      {show.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {show.rating && <span>⭐ {show.rating}</span>}
                    {show.releaseDate && (
                      <span>{new Date(show.releaseDate).getFullYear()}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {(!results.data.movies || results.data.movies.length === 0) &&
              (!results.data.shows || results.data.shows.length === 0) && (
                <Card className="p-6">
                  <p className="text-gray-400">
                    {error ? `Error: ${error}` : 'No results found. Try a different search or check if Simkl API is accessible.'}
                  </p>
                </Card>
              )}
          </div>
        )}

        <Card className="p-6 mt-8">
          <h3 className="text-white font-semibold mb-4">Raw API Response</h3>
          <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs text-gray-300">
            {JSON.stringify(results, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  )
}

