import { env } from '@andji/internal'
import Stripe from 'stripe'

export const stripeServer = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export async function getCurrentSubscription(customerId: string) {
  const subscriptions = await stripeServer.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })
  return subscriptions.data[0]
}
