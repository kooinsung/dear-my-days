import { redirect } from 'next/navigation'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { dayjs, toThisYearDate } from '@/libs/utils'
import { PastPageClient } from './past-page-client'

// 년월 그룹핑 (올해 기준)
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

export default async function PastPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: CategoryType }>
}) {
  const params = await searchParams
  const filterCategory = params.category

  const supabase = await createSupabaseServer()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  // 모든 이벤트를 조회하여 올해 발생일 기준으로 필터링
  let query = supabase
    .from('events')
    .select('*')
    .order('solar_date', { ascending: false })

  if (filterCategory) {
    query = query.eq('category', filterCategory)
  }

  const { data: eventsData } = await query

  const allEvents = eventsData || []
  const today = dayjs().startOf('day')

  // 올해 발생일이 이미 지난 이벤트만 필터링
  const pastEvents = allEvents.filter((event) => {
    const thisYearDate = dayjs(toThisYearDate(event.solar_date)).startOf('day')
    return thisYearDate.isBefore(today, 'day')
  })

  const groupedEvents = groupByYearMonth(pastEvents)

  return (
    <PastPageClient
      events={pastEvents}
      filterCategory={filterCategory}
      groupedEvents={groupedEvents}
    />
  )
}
