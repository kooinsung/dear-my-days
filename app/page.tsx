import type { Event } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { getUpcomingEventsThisYear } from '@/libs/utils'
import { HomePageClient } from './home-page-client'

export default async function HomePage() {
  const supabase = await createSupabaseServer()

  const { data: eventsData, error } = await supabase
    .from('events')
    .select('*')
    .order('solar_date', { ascending: true })

  if (error) {
    throw error
  }

  const upcomingEvents = getUpcomingEventsThisYear(
    (eventsData || []) as Event[],
  )

  return <HomePageClient upcomingEvents={upcomingEvents} />
}
