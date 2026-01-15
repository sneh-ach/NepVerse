'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Dropdown({ options, value, onChange, placeholder, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2 bg-card border border-gray-700 rounded-md text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'transition-all duration-200 hover:border-primary/50',
          'flex items-center justify-between cursor-pointer',
          isOpen && 'border-primary'
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder || 'Select...'}</span>
        <ChevronDown 
          size={16} 
          className={cn('transition-transform duration-200 flex-shrink-0 ml-2', isOpen && 'rotate-180')} 
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-card border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors',
                'first:rounded-t-md last:rounded-b-md',
                value === option.value && 'bg-primary/20 text-primary font-medium'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
