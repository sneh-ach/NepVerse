'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Upload, FileText, Download, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BulkImportPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie')
  const [jsonFile, setJsonFile] = useState<File | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [results, setResults] = useState<{
    created: number
    errors: string[]
  } | null>(null)

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setJsonFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setJsonText(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const downloadTemplate = () => {
    const template = contentType === 'movie' 
      ? [
          {
            title: 'Movie Title',
            titleNepali: 'नेपाली शीर्षक',
            description: 'Movie description',
            descriptionNepali: 'नेपाली विवरण',
            posterUrl: 'https://example.com/poster.jpg',
            backdropUrl: 'https://example.com/backdrop.jpg',
            trailerUrl: 'https://example.com/trailer.mp4',
            releaseDate: '2024-01-01',
            duration: 120,
            rating: 8.5,
            ageRating: 'PG',
            isPublished: false,
            isFeatured: false,
            videoUrl: 'https://example.com/video.m3u8',
          },
        ]
      : [
          {
            title: 'Series Title',
            titleNepali: 'नेपाली शीर्षक',
            description: 'Series description',
            descriptionNepali: 'नेपाली विवरण',
            posterUrl: 'https://example.com/poster.jpg',
            backdropUrl: 'https://example.com/backdrop.jpg',
            trailerUrl: 'https://example.com/trailer.mp4',
            releaseDate: '2024-01-01',
            rating: 8.5,
            ageRating: 'PG',
            isPublished: false,
            isFeatured: false,
          },
        ]

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contentType}-template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!jsonText.trim()) {
      toast.error('Please provide JSON data')
      return
    }

    try {
      const items = JSON.parse(jsonText)
      if (!Array.isArray(items)) {
        toast.error('JSON must be an array of items')
        return
      }

      setIsImporting(true)
      setResults(null)

      const response = await fetch('/api/admin/content/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, contentType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Import failed')
      }

      setResults(data)
      toast.success(`Successfully imported ${data.created} items`)
      
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} items failed to import`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bulk Import Content</h1>
          <p className="text-gray-400">Import multiple movies or series from JSON file</p>
        </div>

        <div className="bg-card rounded-lg p-8 space-y-6">
          {/* Content Type */}
          <div>
            <label className="block text-white font-semibold mb-2">Content Type</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setContentType('movie')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  contentType === 'movie'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <span className="text-white font-semibold">Movies</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('series')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  contentType === 'series'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <span className="text-white font-semibold">Series</span>
              </button>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold mb-1">Need a template?</h3>
                <p className="text-gray-400 text-sm">Download a sample JSON template</p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download size={18} className="mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-white font-semibold mb-2">Upload JSON File</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-primary transition-colors">
              <input
                type="file"
                id="json-file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="json-file"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {jsonFile ? (
                  <>
                    <FileText size={32} className="text-primary mb-2" />
                    <p className="text-white text-sm font-semibold">{jsonFile.name}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setJsonFile(null)
                        setJsonText('')
                      }}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-500 mb-2" />
                    <p className="text-white text-sm font-semibold">Click to select JSON file</p>
                    <p className="text-gray-500 text-xs mt-1">or paste JSON below</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* JSON Text Area */}
          <div>
            <label className="block text-white font-semibold mb-2">Or Paste JSON</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary"
              placeholder='[{"title": "Movie Title", "description": "...", ...}]'
            />
          </div>

          {/* Results */}
          {results && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Import Results</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle size={18} />
                  <span>{results.created} items imported successfully</span>
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-red-400 font-semibold mb-2">Errors:</p>
                    <ul className="space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index} className="flex items-start space-x-2 text-red-300 text-sm">
                          <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={handleImport}
              isLoading={isImporting}
              className="flex-1"
            >
              <Upload size={20} className="mr-2" />
              Import Content
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/content')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


