'use client'

import { useQuery } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

export const eventLimitKey = ['event-limit'] as const

interface EventLimitInfo {
  eventCount: number
  eventLimit: number
  canCreate: boolean
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

      const eventCount = countResult.count ?? 0
      const eventLimit = subscriptionRes?.data?.eventLimit ?? 3

      return {
        eventCount,
        eventLimit,
        canCreate: eventCount < eventLimit,
      }
    },
  })
}
