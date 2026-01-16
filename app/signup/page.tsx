'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const { signup, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting || isLoading) {
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match. Please try again.', {
        duration: 3000,
      })
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.', {
        duration: 3000,
      })
      return
    }

    if (!formData.email && !formData.phone) {
      toast.error('Please provide either an email or phone number.', {
        duration: 3000,
      })
      return
    }

    // Validate email format if provided
    if (formData.email && !formData.email.includes('@')) {
      toast.error('Please enter a valid email address.', {
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    setIsLoading(true)

    try {
      await signup({
        email: formData.email?.trim().toLowerCase() || undefined,
        phone: formData.phone?.trim() || undefined,
        password: formData.password,
        firstName: formData.firstName?.trim() || undefined,
        lastName: formData.lastName?.trim() || undefined,
      })
      toast.success('Account created successfully! Welcome to NepVerse!', {
        duration: 4000,
      })
      // Redirect to profiles to create first profile
      router.push('/profiles')
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.', {
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">NepVerse</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Join NepVerse</h2>
          <p className="text-sm sm:text-base text-gray-400">Start your free trial today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-card p-6 sm:p-8 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="First name"
            />
            <Input
              type="text"
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Last name"
            />
          </div>

          <Input
            type="email"
            label="Email (Optional)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
          />

          <Input
            type="tel"
            label="Phone (Optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+977 98XXXXXXXX"
          />

          <Input
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="At least 8 characters"
          />

          <Input
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            placeholder="Confirm your password"
          />

          <div className="text-xs text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-lg" isLoading={isLoading}>
            Start Free Trial
          </Button>

          <div className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-light font-semibold">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}



