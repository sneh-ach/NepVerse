'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { subscriptionService } from '@/lib/clientStorage'
import toast from 'react-hot-toast'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    priceNPR: 299,
    priceUSD: 2.99,
    description: 'Perfect for individuals',
    features: [
      'HD Quality (720p)',
      '1 Device',
      'Unlimited Movies & Series',
      'Cancel Anytime',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceNPR: 499,
    priceUSD: 4.99,
    description: 'Most Popular',
    features: [
      'Full HD Quality (1080p)',
      '2 Devices',
      'Unlimited Movies & Series',
      'Cancel Anytime',
      'Download for Offline',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceNPR: 799,
    priceUSD: 7.99,
    description: 'Best Value',
    features: [
      'Ultra HD Quality (4K)',
      '4 Devices',
      'Unlimited Movies & Series',
      'Cancel Anytime',
      'Download for Offline',
      'Priority Support',
    ],
  },
]

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isChangingPlan = searchParams.get('change') === 'true'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [country, setCountry] = useState<'NP' | 'US'>('NP')
  const [loading, setLoading] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string
    name: string
    price: number
    currency: string
  } | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    const price = country === 'NP' 
      ? (billingCycle === 'yearly' ? plan.priceNPR * 10 : plan.priceNPR)
      : (billingCycle === 'yearly' ? plan.priceUSD * 10 : plan.priceUSD)
    const currency = country === 'NP' ? 'NPR' : 'USD'

    // For Stripe (international), directly create checkout session
    // For Nepal, show payment modal for eSewa/Khalti (when implemented)
    if (country === 'NP') {
      // Show payment modal for local payment methods
      setSelectedPlan({
        id: planId,
        name: plan.name,
        price,
        currency,
      })
      setShowPaymentModal(true)
    } else {
      // For international, go directly to Stripe Checkout
      setLoading(planId)
      
      try {
        const response = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            planId,
            billingCycle,
            country,
          }),
        })

        const data = await response.json()

        if (data.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = data.checkoutUrl
        } else if (data.error || !response.ok) {
          toast.error(data.message || data.error || 'Failed to create subscription', {
            duration: 3000,
          })
          setLoading(null)
        }
      } catch (error) {
        console.error('Subscription error:', error)
        toast.error('Failed to create subscription. Please try again.', {
          duration: 3000,
        })
        setLoading(null)
      }
    }
  }

  const handlePaymentSuccess = () => {
    if (!selectedPlan) return

    try {
      if (isChangingPlan && user?.subscription) {
        // Change existing plan
        subscriptionService.changePlan(selectedPlan.id, billingCycle)
        toast.success(`Plan changed to ${selectedPlan.name}!`, {
          duration: 4000,
        })
        router.push('/dashboard/subscription')
      } else {
        // Create new subscription
        subscriptionService.create(selectedPlan.id, billingCycle)
        toast.success('Subscription activated! Welcome to NepVerse Premium!', {
          duration: 4000,
        })
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process subscription. Please try again.', {
        duration: 4000,
      })
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isChangingPlan ? 'Change Your Plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            {isChangingPlan 
              ? 'Select a new plan to upgrade or downgrade your subscription.'
              : 'Start your free trial. Cancel anytime.'}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-white ${billingCycle === 'monthly' ? 'font-semibold' : ''}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 bg-gray-700 rounded-full transition-colors"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-primary rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className={`text-white ${billingCycle === 'yearly' ? 'font-semibold' : ''}`}>
              Yearly
              <span className="text-primary ml-2">Save 20%</span>
            </span>
          </div>

          {/* Country Selector */}
          <div className="mb-8">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as 'NP' | 'US')}
              className="px-4 py-2 bg-card border border-gray-700 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 hover:border-gray-600"
              aria-label="Select country"
            >
              <option value="NP">Nepal (NPR)</option>
              <option value="US">International (USD)</option>
            </select>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = country === 'NP' 
              ? (billingCycle === 'yearly' ? plan.priceNPR * 10 : plan.priceNPR)
              : (billingCycle === 'yearly' ? plan.priceUSD * 10 : plan.priceUSD)
            const currency = country === 'NP' ? 'NPR' : 'USD'

            return (
              <div
                key={plan.id}
                className={`bg-card rounded-lg p-8 relative ${
                  plan.popular ? 'border-2 border-primary' : 'border border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {formatCurrency(price, currency)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check size={20} className="text-primary flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full group/btn font-bold"
                  onClick={() => handleSubscribe(plan.id)}
                  isLoading={loading === plan.id}
                >
                  <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">
                    {isChangingPlan 
                      ? (user?.subscription?.planId === plan.id ? 'Current Plan' : 'Change to This Plan')
                      : (user ? 'Subscribe' : 'Start Free Trial')}
                  </span>
                </Button>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          currency={selectedPlan.currency}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
}

