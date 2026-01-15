'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { Search, Filter } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

// Force dynamic rendering - this page uses useSearchParams
export const dynamic = 'force-dynamic'

function BrowsePageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({})
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: 'All Genres' },
  ])
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  // Load genres from API
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await fetch('/api/genres')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setGenres([
              { id: 'all', name: 'All Genres' },
              ...data.map((g: any) => ({ id: g.slug || g.id, name: g.name })),
            ])
          }
        }
      } catch (error) {
        console.error('Error loading genres:', error)
      }
    }
    loadGenres()
  }, [])

  // Load genre sections on mount
  useEffect(() => {
    const loadGenreSections = async () => {
      try {
        const sections: Record<string, any[]> = {}
        for (const genre of genres.slice(1)) {
          try {
            const res = await fetch(`/api/content/search?genre=${genre.id}&limit=10`)
            if (res.ok) {
              const data = await res.json()
              sections[genre.id] = data
            }
          } catch (e) {
            // Ignore errors
          }
        }
        setGenreSections(sections)
      } catch (error) {
        console.error('Error loading genre sections:', error)
      }
    }
    if (genres.length > 1) {
      loadGenreSections()
    }
  }, [genres])

  useEffect(() => {
    // Fetch filtered results with debounced search
    if (debouncedSearchQuery || selectedGenre !== 'all' || selectedYear !== 'all') {
      setIsSearching(true)
      fetchResults()
    } else {
      setResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, selectedGenre, selectedYear])

  const fetchResults = async () => {
    try {
      // Build search URL
      const params = new URLSearchParams()
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      if (selectedGenre !== 'all') params.set('genre', selectedGenre)
      if (selectedYear !== 'all') params.set('year', selectedYear)

      const res = await fetch(`/api/content/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Error fetching search results:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Browse Content</h1>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search movies, series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="primary" className="flex items-center space-x-2 group/btn min-w-[120px]">
              <Search size={20} className="group-hover/btn:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Search</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <span className="text-gray-400">Filters:</span>
            </div>

            <Dropdown
              options={genres.map(g => ({ value: g.id, label: g.name }))}
              value={selectedGenre}
              onChange={setSelectedGenre}
              className="min-w-[150px]"
            />

            <Dropdown
              options={[
                { value: 'all', label: 'All Years' },
                ...years.map(y => ({ value: y.toString(), label: y.toString() }))
              ]}
              value={selectedYear}
              onChange={setSelectedYear}
              className="min-w-[120px]"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="mb-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4 px-4 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Search Results ({results.length})
            </h2>
          </div>
          <ContentCarousel title="" items={results} />
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg">
          <Search size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-xl mb-2">
            {searchQuery || selectedGenre !== 'all' || selectedYear !== 'all'
              ? 'No Results Found'
              : 'Start Exploring'}
          </h3>
          <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
            {searchQuery || selectedGenre !== 'all' || selectedYear !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Search for movies and series or browse by genre to discover amazing Nepali content.'}
          </p>
          {(searchQuery || selectedGenre !== 'all' || selectedYear !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedGenre('all')
                setSelectedYear('all')
              }}
              className="group/btn"
            >
              <span className="group-hover/btn:scale-110 transition-transform duration-300 inline-block">Clear Filters</span>
            </Button>
          )}
        </div>
      )}

      {/* Genre Sections */}
      {!searchQuery && selectedGenre === 'all' && (
        <div className="space-y-8 mt-8">
          {genres.slice(1).map((genre) => {
            const genreContent = genreSections[genre.id] || []
            
            return (
              <ContentCarousel
                key={genre.id}
                title={genre.name}
                items={genreContent}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  )
}

