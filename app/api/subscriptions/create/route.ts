import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getPaymentProvider } from '@/lib/payment'
import { stripe } from '@/lib/payment'

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader) || 
                 request.cookies.get('token')?.value || 
                 request.cookies.get('auth-token')?.value

    if (!token) return null

    const payload = verifyToken(token)
    return payload?.userId || null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { planId, billingCycle, country } = await request.json()

    // Get user profile for country
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    })

    const userCountry = country || user?.profile?.country || 'US'

    // Get payment provider
    const paymentProvider = getPaymentProvider(userCountry)

    // For Stripe, create checkout session
    if (userCountry !== 'NP') {
      // Get Stripe price ID based on plan and billing cycle
      const priceIds: Record<string, { monthly: string; yearly: string }> = {
        basic: {
          monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
          yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
        },
        standard: {
          monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || '',
          yearly: process.env.STRIPE_PRICE_STANDARD_YEARLY || '',
        },
        premium: {
          monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
          yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
        },
      }

      const priceId = priceIds[planId]?.[billingCycle === 'yearly' ? 'yearly' : 'monthly']

      if (!priceId) {
        return NextResponse.json(
          { message: 'Invalid plan' },
          { status: 400 }
        )
      }

      // Get or create Stripe customer
      let customerId = user?.subscriptions?.[0]?.stripeCustomerId

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: {
            userId: userId,
          },
        })
        customerId = customer.id
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          planId,
          billingCycle,
        },
      })

      return NextResponse.json({ checkoutUrl: session.url })
    } else {
      // For Nepal, use local payment providers (eSewa/Khalti)
      // This would be implemented with the LocalPaymentProvider
      return NextResponse.json(
        { message: 'Local payment integration not yet implemented' },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

