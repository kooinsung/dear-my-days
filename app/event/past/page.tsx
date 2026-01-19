import { redirect } from 'next/navigation'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { PastPageClient } from './past-page-client'

// 올해 발생일 계산
function calculateThisYearOccurrence(solarDate: string): string {
  const eventDate = new Date(solarDate)
  const thisYear = new Date().getFullYear()

  const thisYearDate = new Date(
    thisYear,
    eventDate.getMonth(),
    eventDate.getDate(),
  )

  const year = thisYearDate.getFullYear()
  const month = String(thisYearDate.getMonth() + 1).padStart(2, '0')
  const day = String(thisYearDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 년월 그룹핑 (올해 기준)
function groupByYearMonth(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {}

  for (const event of events) {
    const thisYearDate = calculateThisYearOccurrence(event.solar_date)
    const date = new Date(thisYearDate)
    const yearMonth = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 올해 발생일이 이미 지난 이벤트만 필터링
  const pastEvents = allEvents.filter((event) => {
    const eventDate = new Date(event.solar_date)
    const thisYearDate = new Date(
      today.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
    )
    thisYearDate.setHours(0, 0, 0, 0)

    return thisYearDate < today
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
