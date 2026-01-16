'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentCarousel } from '@/components/content/ContentCarousel'
import { ContentCard } from '@/components/content/ContentCard'
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
  const [selectedRating, setSelectedRating] = useState<string>('all')
  const [selectedAgeRating, setSelectedAgeRating] = useState<string>('all')
  const [selectedQuality, setSelectedQuality] = useState<string>('all')
  const [selectedContentType, setSelectedContentType] = useState<string>('all')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [genreSections, setGenreSections] = useState<Record<string, any[]>>({})
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: 'All Genres' },
  ])
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Generate years from 1970 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i)
  
  // Rating options (out of 5)
  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' },
    { value: '3.0', label: '3.0+ Stars' },
    { value: '2.5', label: '2.5+ Stars' },
    { value: '2.0', label: '2.0+ Stars' },
  ]
  
  // Age rating options
  const ageRatingOptions = [
    { value: 'all', label: 'All Ages' },
    { value: 'G', label: 'G - General' },
    { value: 'PG', label: 'PG - Parental Guidance' },
    { value: 'PG-13', label: 'PG-13' },
    { value: 'R', label: 'R - Restricted' },
    { value: '18+', label: '18+' },
  ]
  
  // Quality options - must match upload form values
  const qualityOptions = [
    { value: 'all', label: 'All Quality' },
    { value: '4K', label: '4K Ultra HD' },
    { value: '1080p', label: '1080p Full HD' },
    { value: '720p', label: '720p HD' },
    { value: '480p', label: '480p SD' },
  ]
  
  // Content type options
  const contentTypeOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'movie', label: 'Movies Only' },
    { value: 'series', label: 'Series Only' },
  ]

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
    const hasFilters = debouncedSearchQuery || 
      selectedGenre !== 'all' || 
      selectedYear !== 'all' || 
      selectedRating !== 'all' || 
      selectedAgeRating !== 'all' || 
      selectedQuality !== 'all' || 
      selectedContentType !== 'all'
    
    if (hasFilters) {
      setIsSearching(true)
      fetchResults()
    } else {
      setResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchQuery, selectedGenre, selectedYear, selectedRating, selectedAgeRating, selectedQuality, selectedContentType])

  const fetchResults = async () => {
    try {
      // Build search URL with all filters
      const params = new URLSearchParams()
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      if (selectedGenre !== 'all') params.set('genre', selectedGenre)
      if (selectedYear !== 'all') params.set('year', selectedYear)
      if (selectedRating !== 'all') params.set('rating', selectedRating)
      if (selectedAgeRating !== 'all') params.set('ageRating', selectedAgeRating)
      if (selectedQuality !== 'all') params.set('quality', selectedQuality)
      if (selectedContentType !== 'all') params.set('type', selectedContentType)

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
    <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">Browse Content</h1>

        {/* Search and Filters */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search movies, series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
            </div>
            <Button variant="primary" className="flex items-center justify-center space-x-2 group/btn min-w-full sm:min-w-[120px]">
              <Search size={18} className="sm:w-5 sm:h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
              <span className="font-semibold text-sm sm:text-base">Search</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter size={18} className="sm:w-5 sm:h-5 text-gray-400" />
              <span className="text-gray-400 font-semibold text-sm sm:text-base">Filters:</span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
              <Dropdown
                options={genres.map(g => ({ value: g.id, label: g.name }))}
                value={selectedGenre}
                onChange={setSelectedGenre}
                className="min-w-0 sm:min-w-[150px] text-sm"
                placeholder="All Genres"
              />

              <Dropdown
                options={[
                  { value: 'all', label: 'All Years' },
                  ...years.map(y => ({ value: y.toString(), label: y.toString() }))
                ]}
                value={selectedYear}
                onChange={setSelectedYear}
                className="min-w-0 sm:min-w-[120px] text-sm"
                placeholder="All Years"
              />

              <Dropdown
                options={ratingOptions}
                value={selectedRating}
                onChange={setSelectedRating}
                className="min-w-0 sm:min-w-[140px] text-sm"
                placeholder="All Ratings"
              />

              <Dropdown
                options={ageRatingOptions}
                value={selectedAgeRating}
                onChange={setSelectedAgeRating}
                className="min-w-0 sm:min-w-[140px] text-sm"
                placeholder="All Ages"
              />

              <Dropdown
                options={qualityOptions}
                value={selectedQuality}
                onChange={setSelectedQuality}
                className="min-w-0 sm:min-w-[140px] text-sm"
                placeholder="All Quality"
              />

              <Dropdown
                options={contentTypeOptions}
                value={selectedContentType}
                onChange={setSelectedContentType}
                className="min-w-0 sm:min-w-[140px] text-sm"
                placeholder="All Content"
              />
            </div>
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              Search Results ({results.length})
            </h2>
          </div>
          {/* Grid View for Mobile (2 per row), Carousel for Desktop */}
          <div className="block md:hidden px-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {results.map((item) => (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  titleNepali={item.titleNepali}
                  description={item.description}
                  descriptionNepali={item.descriptionNepali}
                  posterUrl={item.posterUrl}
                  backdropUrl={item.backdropUrl}
                  videoUrl={item.videoUrl}
                  trailerUrl={item.trailerUrl}
                  type={item.type}
                  rating={item.rating}
                  year={item.year}
                  duration={item.duration}
                  quality={item.quality}
                  ageRating={item.ageRating}
                  cast={item.cast}
                  matureThemes={item.matureThemes}
                  tags={item.tags}
                  genres={item.genres}
                  className="w-full"
                />
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <ContentCarousel title="" items={results} />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg">
          <Search size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-xl mb-2">
            {searchQuery || selectedGenre !== 'all' || selectedYear !== 'all' || selectedRating !== 'all' || selectedAgeRating !== 'all' || selectedQuality !== 'all' || selectedContentType !== 'all'
              ? 'No Results Found'
              : 'Start Exploring'}
          </h3>
          <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
            {searchQuery || selectedGenre !== 'all' || selectedYear !== 'all' || selectedRating !== 'all' || selectedAgeRating !== 'all' || selectedQuality !== 'all' || selectedContentType !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Search for movies and series or browse by genre to discover amazing Nepali content.'}
          </p>
          {(searchQuery || selectedGenre !== 'all' || selectedYear !== 'all' || selectedRating !== 'all' || selectedAgeRating !== 'all' || selectedQuality !== 'all' || selectedContentType !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedGenre('all')
                setSelectedYear('all')
                setSelectedRating('all')
                setSelectedAgeRating('all')
                setSelectedQuality('all')
                setSelectedContentType('all')
              }}
              className="group/btn"
            >
              <span className="group-hover/btn:scale-110 transition-transform duration-300 inline-block">Clear All Filters</span>
            </Button>
          )}
        </div>
      )}

      {/* Genre Sections - Only show when no filters are active */}
      {!searchQuery && 
       selectedGenre === 'all' && 
       selectedYear === 'all' && 
       selectedRating === 'all' && 
       selectedAgeRating === 'all' && 
       selectedQuality === 'all' && 
       selectedContentType === 'all' && (
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

