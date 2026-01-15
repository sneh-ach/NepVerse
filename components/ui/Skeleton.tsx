import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-gray-800'
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

export function ContentCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-48 md:w-56 lg:w-64">
      <Skeleton className="aspect-[2/3] w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" variant="text" />
      <Skeleton className="h-3 w-1/2" variant="text" />
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[80vh] min-h-[500px]">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="relative z-10 container mx-auto px-4 lg:px-8 pb-16 h-full flex items-end">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-16 w-3/4" variant="text" />
          <Skeleton className="h-6 w-1/2" variant="text" />
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-5/6" variant="text" />
          <div className="flex space-x-4 mt-6">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}



