'use client'

import { useSearchParams } from 'next/navigation'
import { EventDetailSkeleton } from '@/components/skeletons/EventDetailSkeleton'
import { useEvent } from '@/hooks/use-events'
import { EventDetailContent } from './detail-content'

export function DetailPageClient() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('id')

  const { data: event, isLoading } = useEvent(eventId)

  if (!eventId) {
    return null
  }

  if (isLoading) {
    return <EventDetailSkeleton />
  }

  if (!event) {
    return null
  }

  return <EventDetailContent event={event} eventId={eventId} />
}
