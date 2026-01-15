// Abstracted payment interface
// Supports Stripe (international) and can be extended for eSewa/Khalti

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export interface PaymentProvider {
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>
  cancelSubscription(subscriptionId: string): Promise<void>
  getSubscription(subscriptionId: string): Promise<SubscriptionResult>
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

export interface SubscriptionResult {
  id: string
  status: string
  currentPeriodEnd: Date
  customerId: string
}

// Stripe implementation
export class StripePaymentProvider implements PaymentProvider {
  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResult> {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
    })

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      customerId: subscription.customer as string,
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      customerId: subscription.customer as string,
    }
  }
}

// eSewa/Khalti implementation placeholder
export class LocalPaymentProvider implements PaymentProvider {
  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResult> {
    // Implement eSewa/Khalti integration
    throw new Error('Local payment provider not implemented')
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    throw new Error('Local payment provider not implemented')
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    throw new Error('Local payment provider not implemented')
  }
}

// Factory function to get payment provider based on country
export function getPaymentProvider(country?: string): PaymentProvider {
  // For Nepal, use local providers; for others, use Stripe
  if (country === 'NP') {
    return new LocalPaymentProvider()
  }
  return new StripePaymentProvider()
}

export { stripe }




