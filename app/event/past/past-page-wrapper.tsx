'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { PastEventsSkeleton } from '@/components/skeletons/PastEventsSkeleton'
import { useEvents } from '@/hooks/use-events'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { dayjs, toThisYearDate } from '@/libs/utils'
import { PastPageClient } from './past-page-client'

function groupByYearMonth(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {}

  for (const event of events) {
    const thisYearDate = toThisYearDate(event.solar_date)
    const date = dayjs(thisYearDate)
    const yearMonth = date.format('YYYY.MM')

    if (!grouped[yearMonth]) {
      grouped[yearMonth] = []
    }
    grouped[yearMonth].push(event)
  }

  return grouped
}

export function PastPageWrapper() {
  const searchParams = useSearchParams()
  const filterCategory = searchParams.get('category') as
    | CategoryType
    | undefined

  const { data: allEvents, isLoading } = useEvents(
    filterCategory ? { category: filterCategory } : undefined,
  )

  const { pastEvents, groupedEvents } = useMemo(() => {
    if (!allEvents) {
      return { pastEvents: [], groupedEvents: {} }
    }

    const today = dayjs().startOf('day')
    const past = allEvents.filter((event) => {
      const thisYearDate = dayjs(toThisYearDate(event.solar_date)).startOf(
        'day',
      )
      return thisYearDate.isBefore(today, 'day')
    })

    return {
      pastEvents: past,
      groupedEvents: groupByYearMonth(past),
    }
  }, [allEvents])

  if (isLoading) {
    return <PastEventsSkeleton />
  }

  return (
    <PastPageClient
      events={pastEvents}
      filterCategory={filterCategory}
      groupedEvents={groupedEvents}
    />
  )
}
