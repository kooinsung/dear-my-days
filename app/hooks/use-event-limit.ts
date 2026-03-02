'use client'

import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

export const eventLimitKey = ['event-limit'] as const

interface EventLimitInfo {
  eventCount: number
  eventLimit: number
  canCreate: boolean
  isPremium: boolean
}

export function useEventLimit() {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventLimitKey,
    queryFn: async (): Promise<EventLimitInfo> => {
      const [countResult, subscriptionRes] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        fetch('/api/iap/subscription').then((r) => (r.ok ? r.json() : null)),
      ])

      const planType = subscriptionRes?.data?.planType ?? 'FREE'
      const isPremium =
        planType === 'PREMIUM_MONTHLY' || planType === 'PREMIUM_YEARLY'

      // 프리미엄: subscription API가 계산한 eventCount 사용
      // FREE: 전체 이벤트 카운트 사용
      const eventCount =
        isPremium && subscriptionRes?.data?.eventCount != null
          ? subscriptionRes.data.eventCount
          : (countResult.count ?? 0)
      const eventLimit = subscriptionRes?.data?.eventLimit ?? 3

      return {
        eventCount,
        eventLimit,
        canCreate: eventCount < eventLimit,
        isPremium,
      }
    },
  })
}
