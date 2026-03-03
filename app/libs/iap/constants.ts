import type { PlanType, PurchaseType } from '@/libs/supabase/database.types'

export const PRODUCT_INFO: Record<
  string,
  { amount: number; type: PurchaseType; planType?: PlanType }
> = {
  'com.dearmydays.premium.monthly': {
    amount: 4900,
    type: 'SUBSCRIPTION',
    planType: 'PREMIUM_MONTHLY',
  },
  'com.dearmydays.premium.yearly': {
    amount: 49000,
    type: 'SUBSCRIPTION',
    planType: 'PREMIUM_YEARLY',
  },
  'com.dearmydays.event.slot': { amount: 1900, type: 'EVENT_SLOT' },
}

export const FREE_EVENT_LIMIT = 3
export const PREMIUM_MONTHLY_LIMIT = 10

export function getMonthsElapsed(startedAt: string): number {
  const start = new Date(startedAt)
  const now = new Date()
  return Math.max(
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()) +
      1,
    1,
  )
}
