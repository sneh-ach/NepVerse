'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Genre {
  id: string
  name: string
  slug: string
}

interface GenreFilterProps {
  activeGenre?: string
  className?: string
}

export function GenreFilter({ activeGenre, className }: GenreFilterProps) {
  const [genres, setGenres] = useState<Genre[]>([])

  useEffect(() => {
    fetch('/api/genres')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGenres(data)
        }
      })
      .catch(err => console.error('Failed to load genres:', err))
  }, [])

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Link
        href="/browse"
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all',
          !activeGenre
            ? 'bg-primary text-white'
            : 'bg-card text-gray-300 hover:bg-card-hover hover:text-white'
        )}
      >
        All
      </Link>
      {genres.map((genre) => (
        <Link
          key={genre.id}
          href={`/browse?genre=${genre.slug}`}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            activeGenre === genre.slug
              ? 'bg-primary text-white'
              : 'bg-card text-gray-300 hover:bg-card-hover hover:text-white'
          )}
        >
          {genre.name}
        </Link>
      ))}
    </div>
  )
}




