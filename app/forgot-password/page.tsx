'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting || isLoading) {
      return
    }

    // Validate email format
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      try {
        const response = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send reset link')
        }

        setIsLoading(false)
        setEmailSent(true)
        toast.success('Password reset link sent to your email!', {
          duration: 4000,
        })
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.')
        }
        throw error
      }
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'Failed to send reset link')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg text-center">
            <Mail size={64} className="text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            <div className="flex flex-col space-y-3">
              <Button variant="primary" onClick={() => router.push('/login')}>
                Back to Sign In
              </Button>
              <Button variant="ghost" onClick={() => setEmailSent(false)}>
                Resend Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center text-gray-400 hover:text-primary mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Sign In
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">NepVerse</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Forgot Password</h2>
          <p className="text-gray-400">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <Button type="submit" variant="primary" className="w-full font-bold" isLoading={isLoading}>
            Send Reset Link
          </Button>

          <div className="text-center text-gray-400 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-primary hover:text-primary-light font-semibold">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

