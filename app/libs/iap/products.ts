import 'server-only'

export const PRODUCT_INFO: Record<
  string,
  { amount: number; type: 'SUBSCRIPTION' | 'EVENT_SLOT'; planType?: string }
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
