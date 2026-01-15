'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, onClick, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const rippleTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

    // Combine refs
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(buttonRef.current)
      } else if (ref) {
        ref.current = buttonRef.current
      }
    }, [ref])

    // Cleanup all ripples on unmount
    useEffect(() => {
      return () => {
        // Clear all pending timeouts
        rippleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
        rippleTimeoutsRef.current.clear()
        
        // Remove all ripple elements
        const button = buttonRef.current
        if (button) {
          const ripples = button.querySelectorAll('.ripple-effect')
          ripples.forEach(ripple => ripple.remove())
        }
      }
    }, [])

    const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent double-clicks and ensure single event handling
      e.stopPropagation()
      
      const button = buttonRef.current
      if (!button || isLoading || disabled) {
        onClick?.(e)
        return
      }

      // Prevent multiple rapid clicks
      if (button.hasAttribute('data-clicking')) {
        return
      }
      button.setAttribute('data-clicking', 'true')
      setTimeout(() => button.removeAttribute('data-clicking'), 300)

      const rect = button.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height) * 0.6 // Smaller ripple - 60% of smallest dimension
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement('span')
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        transform: scale(0);
        animation: ripple-animation 0.4s ease-out;
        pointer-events: none;
        z-index: 0;
      `
      ripple.classList.add('ripple-effect')

      button.appendChild(ripple)

      const timeout = setTimeout(() => {
        rippleTimeoutsRef.current.delete(timeout)
        if (ripple.parentNode) {
          ripple.remove()
        }
      }, 400)
      
      rippleTimeoutsRef.current.add(timeout)

      // Call onClick after ripple is created
      onClick?.(e)
    }, [isLoading, disabled, onClick])

    const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none overflow-hidden group isolate'
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary via-primary-light to-primary text-white hover:from-primary-light hover:via-primary hover:to-primary-dark focus-visible:ring-primary shadow-lg hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 transform-gpu',
      secondary: 'bg-gradient-to-r from-secondary via-secondary-light to-secondary text-white hover:from-secondary-light hover:via-secondary hover:to-secondary-light focus-visible:ring-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/50 hover:scale-105 active:scale-95 transform-gpu',
      outline: 'border-2 border-gray-600 text-white hover:bg-gray-800/80 hover:border-primary/60 focus-visible:ring-primary hover:scale-105 active:scale-95 transform-gpu backdrop-blur-sm hover:shadow-lg hover:shadow-primary/20',
      ghost: 'text-white hover:bg-gray-800/60 focus-visible:ring-primary hover:scale-105 active:scale-95 transform-gpu backdrop-blur-sm',
      destructive: 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white hover:from-red-500 hover:via-red-600 hover:to-red-700 focus-visible:ring-red-500 shadow-lg hover:shadow-2xl hover:shadow-red-500/50 hover:scale-105 active:scale-95 transform-gpu',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm min-h-[36px] gap-2',
      md: 'px-6 py-3 text-base min-h-[44px] gap-2',
      lg: 'px-8 py-4 text-lg min-h-[52px] gap-3',
    }

    return (
      <>
        <style jsx>{`
          .ripple-effect {
            position: absolute !important;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            transform: scale(0);
            animation: ripple-animation 0.4s ease-out;
            pointer-events: none;
            z-index: 0;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          @keyframes ripple-animation {
            to {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          
          .button-glow {
            position: absolute;
            inset: -2px;
            border-radius: inherit;
            background: linear-gradient(45deg, transparent 30%, rgba(229, 9, 20, 0.3) 50%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: -1;
          }
          
          .group:hover .button-glow {
            opacity: 1;
            animation: glow-sweep 2s ease-in-out infinite;
          }
          
          @keyframes glow-sweep {
            0%, 100% {
              transform: translateX(-100%) translateY(-100%);
            }
            50% {
              transform: translateX(100%) translateY(100%);
            }
          }
          
          .loading-spinner {
            animation: spin 0.8s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .button-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
          }
          
          .group:hover .button-shine {
            left: 100%;
          }
        `}</style>
        <button
          ref={buttonRef}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          disabled={disabled || isLoading}
          onClick={createRipple}
          {...props}
        >
          {/* Glow effect */}
          <span className="button-glow" />
          
          {/* Shine effect */}
          <span className="button-shine" />
          
          {/* Content */}
          <span className="relative z-10 flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="loading-spinner -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="animate-pulse">Loading...</span>
              </>
            ) : (
              children
            )}
          </span>
        </button>
      </>
    )
  }
)

Button.displayName = 'Button'
