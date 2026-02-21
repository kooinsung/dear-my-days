import { redirect } from 'next/navigation'
import { requireAuth } from '@/libs/auth/require-auth'
import type { Event } from '@/libs/supabase/database.types'
import { EventDetailContent } from './detail-content'

export default async function DetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const eventId = params.id

  if (!eventId) {
    redirect('/')
  }

  const { supabase } = await requireAuth()

  // 서버 사이드에서 데이터 fetch
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single<Event>()

  if (error || !event) {
    redirect('/')
  }

  return <EventDetailContent event={event} eventId={eventId} />
}
