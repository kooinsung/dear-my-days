import { Suspense } from 'react'
import { CalendarSkeleton } from '@/components/skeletons/CalendarSkeleton'
import { CalendarClient } from './calendar-client'

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarClient />
    </Suspense>
  )
}
