'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

// Force dynamic rendering - this page uses useSearchParams
export const dynamic = 'force-dynamic'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user } = useAuth()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [user, router, searchParams])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting || isLoading) {
      return
    }

    // Basic validation
    if (!emailOrPhone.trim()) {
      toast.error('Please enter your email or phone number')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const result = await login(emailOrPhone.trim(), password)
      
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100))
      
      toast.success('Welcome back to NepVerse!', {
        duration: 3000,
      })
      
      // Always redirect to profile selection - user must choose profile every time
      router.push('/profiles')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials and try again.', {
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-y-auto">
      <div className="w-full max-w-md mx-auto my-auto sm:my-0">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">NepVerse</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Sign In</h2>
          <p className="text-sm sm:text-base text-gray-400">Welcome back! Please sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-card p-6 sm:p-8 rounded-lg">
          <Input
            type="text"
            label="Email or Phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            placeholder="Enter your email or phone number"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200"
              />
              <span className="text-gray-300 text-sm">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-primary hover:text-primary-light text-sm">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-lg" isLoading={isLoading}>
            Sign In
          </Button>

          <div className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-light font-semibold">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}



