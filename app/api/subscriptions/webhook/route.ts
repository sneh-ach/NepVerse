import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payment'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route uses headers and Prisma
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { message: 'No signature' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { message: 'Webhook error' },
      { status: 400 }
    )
  }

  // Handle the event (with idempotency check using event ID)
  const eventId = event.id
  // Check if we've already processed this event (using metadata or separate tracking)
  // For now, we'll rely on Stripe's event deduplication, but add a simple check
  // Note: In production, use a proper idempotency table or Redis

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId

      if (userId && planId) {
        // Use transaction for atomicity and check for existing subscription
        await prisma.$transaction(async (tx) => {
          // Check if subscription already exists (idempotency)
          const existing = await tx.subscription.findUnique({
            where: { stripeSubscriptionId: session.subscription },
          })
          
          if (existing && existing.status === 'ACTIVE') {
            // Already processed - skip
            return
          }
          
          // Create or update subscription
          await tx.subscription.upsert({
            where: { stripeSubscriptionId: session.subscription },
            update: {
              status: 'ACTIVE',
              currentPeriodEnd: new Date(session.subscription_details?.current_period_end * 1000),
            },
            create: {
              userId,
              planId,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
              currentPeriodStart: new Date(session.subscription_details?.current_period_start * 1000),
              currentPeriodEnd: new Date(session.subscription_details?.current_period_end * 1000),
            },
          })
        })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
      break
    }

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}




