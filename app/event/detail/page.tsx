import { Suspense } from 'react'
import { EventDetailSkeleton } from '@/components/skeletons/EventDetailSkeleton'
import { DetailPageClient } from './detail-page-client'

export default function DetailPage() {
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <DetailPageClient />
    </Suspense>
  )
}
