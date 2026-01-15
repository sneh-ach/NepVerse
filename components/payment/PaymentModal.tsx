'use client'

import React, { useState } from 'react'
import { X, CreditCard, Lock, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  planName: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  onSuccess: () => void
}

export function PaymentModal({
  isOpen,
  onClose,
  planName,
  price,
  currency,
  billingCycle,
  onSuccess,
}: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'esewa' | 'khalti'>('card')

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid 16-digit card number', {
          duration: 3000,
        })
        return
      }
      if (!cardName.trim()) {
        toast.error('Please enter the cardholder name', {
          duration: 2500,
        })
        return
      }
      if (expiryDate.length < 5) {
        toast.error('Please enter a valid expiry date (MM/YY)', {
          duration: 3000,
        })
        return
      }
      if (cvv.length < 3) {
        toast.error('Please enter a valid CVV (3-4 digits)', {
          duration: 3000,
        })
        return
      }
    }

    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      toast.success('Payment successful! Your subscription is now active.', {
        duration: 4000,
      })
      onSuccess()
      onClose()
    }, 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="lg">
      <div className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-card p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Plan</span>
            <span className="text-white font-semibold">{planName}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Billing Cycle</span>
            <span className="text-white font-semibold capitalize">{billingCycle}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-gray-400">Total</span>
            <span className="text-2xl font-bold text-primary">
              {currency} {price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CreditCard size={24} className={`mx-auto mb-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-white' : 'text-gray-400'}`}>
                Card
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('esewa')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                paymentMethod === 'esewa'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-6 h-6 mx-auto mb-2 rounded ${paymentMethod === 'esewa' ? 'bg-[#54C571]' : 'bg-gray-600'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'esewa' ? 'text-white' : 'text-gray-400'}`}>
                eSewa
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('khalti')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                paymentMethod === 'khalti'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-6 h-6 mx-auto mb-2 rounded ${paymentMethod === 'khalti' ? 'bg-[#5C2D91]' : 'bg-gray-600'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'khalti' ? 'text-white' : 'text-gray-400'}`}>
                Khalti
              </span>
            </button>
          </div>
        </div>

        {/* Card Payment Form */}
        {paymentMethod === 'card' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Card Number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              required
            />

            <Input
              label="Cardholder Name"
              type="text"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryChange}
                maxLength={5}
                required
              />

              <Input
                label="CVV"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                maxLength={4}
                required
              />
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Lock size={16} />
              <span>Your payment information is secure and encrypted</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold text-lg group/btn"
              isLoading={isProcessing}
            >
              <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">
                {isProcessing ? 'Processing...' : `Pay ${currency} ${price.toLocaleString()}`}
              </span>
            </Button>
          </form>
        )}

        {/* eSewa Payment */}
        {paymentMethod === 'esewa' && (
          <div className="space-y-4">
            <div className="bg-[#54C571]/10 border border-[#54C571]/30 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-[#54C571] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">e</span>
              </div>
              <p className="text-white mb-4">You will be redirected to eSewa to complete your payment</p>
              <Button
                variant="primary"
                className="w-full bg-[#54C571] hover:bg-[#54C571]/90 font-bold group/btn"
                onClick={() => {
                  toast.success('Redirecting to eSewa...', {
                    duration: 2000,
                  })
                  setTimeout(() => {
                    onSuccess()
                    onClose()
                  }, 1500)
                }}
              >
                <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Pay with eSewa</span>
              </Button>
            </div>
          </div>
        )}

        {/* Khalti Payment */}
        {paymentMethod === 'khalti' && (
          <div className="space-y-4">
            <div className="bg-[#5C2D91]/10 border border-[#5C2D91]/30 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-[#5C2D91] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <p className="text-white mb-4">You will be redirected to Khalti to complete your payment</p>
              <Button
                variant="primary"
                className="w-full bg-[#5C2D91] hover:bg-[#5C2D91]/90 font-bold group/btn"
                onClick={() => {
                  toast.success('Redirecting to Khalti...', {
                    duration: 2000,
                  })
                  setTimeout(() => {
                    onSuccess()
                    onClose()
                  }, 1500)
                }}
              >
                <span className="group-hover/btn:scale-105 transition-transform duration-300 inline-block">Pay with Khalti</span>
              </Button>
            </div>
          </div>
        )}

        {/* Free Trial Notice */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start space-x-3">
          <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">7-Day Free Trial</p>
            <p>Your subscription will start after the free trial period. Cancel anytime during the trial.</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

