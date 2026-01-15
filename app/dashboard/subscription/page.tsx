'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { CreditCard, Calendar, Check, X, Crown, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { subscriptionService } from '@/lib/clientStorage'

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingSub, setLoadingSub] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/subscription')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      // Try API first
      const response = await fetch('/api/subscriptions/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const sub = await response.json()
        setSubscription(sub)
      } else {
        // Fallback to localStorage
        const sub = subscriptionService.getCurrent()
        setSubscription(sub)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Fallback to localStorage
      try {
        const sub = subscriptionService.getCurrent()
        setSubscription(sub)
      } catch (fallbackError) {
        setSubscription(null)
      }
    } finally {
      setLoadingSub(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return
    }

    try {
      // Try API first
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        toast.success('Subscription will be cancelled at the end of your billing period.', {
          duration: 4000,
        })
        fetchSubscription()
      } else {
        // Fallback to localStorage
        subscriptionService.cancel()
        toast.success('Subscription will be cancelled at the end of your billing period.', {
          duration: 4000,
        })
        fetchSubscription()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription. Please try again.', {
        duration: 4000,
      })
    }
  }

  const handleResume = () => {
    try {
      subscriptionService.resume()
      toast.success('Subscription resumed successfully!', {
        duration: 3000,
      })
      fetchSubscription()
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume subscription. Please try again.', {
        duration: 4000,
      })
    }
  }

  if (loading || loadingSub) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Subscription</h1>
          <p className="text-gray-400">Manage your subscription and billing</p>
        </div>

        {subscription ? (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-card p-6 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center border ${
                    subscription.planId === 'premium' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' :
                    subscription.planId === 'standard' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30' :
                    'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30'
                  }`}>
                    {subscription.planId === 'premium' ? (
                      <Crown size={32} className="text-yellow-400" fill="currentColor" />
                    ) : subscription.planId === 'standard' ? (
                      <Zap size={32} className="text-blue-400" fill="currentColor" />
                    ) : (
                      <Star size={32} className="text-primary" fill="currentColor" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm text-gray-400 mb-1 uppercase tracking-wide">Current Plan</h2>
                    <p className={`text-3xl font-bold capitalize ${
                      subscription.planId === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' :
                      subscription.planId === 'standard' ? 'text-blue-400' :
                      'text-primary'
                    }`}>
                      {subscription.planId === 'basic' ? 'Basic' : 
                       subscription.planId === 'standard' ? 'Standard' : 
                       subscription.planId === 'premium' ? 'Premium' : 
                       subscription.planId}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {subscription.planId === 'basic' && 'HD Quality • 1 Device'}
                      {subscription.planId === 'standard' && 'Full HD • 2 Devices'}
                      {subscription.planId === 'premium' && 'Ultra HD 4K • 4 Devices'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-2 uppercase tracking-wide">Status</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                    subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    subscription.status === 'CANCELED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                  <p className="text-yellow-500">
                    Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Period</p>
                  <p className="text-white">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Next Billing Date</p>
                  <p className="text-white">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Plan Features</h3>
              <div className="space-y-2">
                {subscription.planId === 'basic' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">HD Quality (720p)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">1 Device</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Unlimited Movies & Series</span>
                    </div>
                  </>
                )}
                {subscription.planId === 'standard' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Full HD Quality (1080p)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">2 Devices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Download for Offline</span>
                    </div>
                  </>
                )}
                {subscription.planId === 'premium' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Ultra HD Quality (4K)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">4 Devices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Download for Offline</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={20} className="text-primary" />
                      <span className="text-gray-300">Priority Support</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Manage Subscription</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {subscription.cancelAtPeriodEnd ? (
                  <Button onClick={handleResume} variant="primary" className="flex-1 group/btn font-bold">
                    <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Resume Subscription</span>
                  </Button>
                ) : (
                  <Button onClick={handleCancel} variant="destructive" className="flex-1 group/btn font-bold">
                    <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Cancel Subscription</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 group/btn font-semibold backdrop-blur-md"
                  onClick={() => router.push('/pricing?change=true')}
                >
                  <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Change Plan</span>
                </Button>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
              <p className="text-gray-400">Payment history will be displayed here</p>
            </div>
          </div>
        ) : (
          <div className="bg-card p-8 rounded-lg text-center">
            <CreditCard size={48} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Subscription</h2>
            <p className="text-gray-400 mb-6">Subscribe to start watching unlimited Nepali content</p>
            <Link href="/pricing">
              <Button variant="primary" size="lg">
                View Plans
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

