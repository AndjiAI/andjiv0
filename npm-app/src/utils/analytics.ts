// Analytics disabled - no PostHog tracking
import type { AnalyticsEvent } from '@andji/common/constants/analytics-events'

// Store the identified user ID
let currentUserId: string | undefined

export let identified: boolean = false

export function initAnalytics() {
  // Analytics disabled - do nothing
  return
}

export async function flushAnalytics() {
  // No analytics to flush
  return
}

export function identifyUser(
  userId: string,
  properties?: Record<string, any>,
) {
  currentUserId = userId
  identified = true
  // No tracking
}

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, any>,
) {
  // No tracking
}

export function logError(
  error: Error | unknown,
  context?: Record<string, any>,
) {
  // No error tracking
}