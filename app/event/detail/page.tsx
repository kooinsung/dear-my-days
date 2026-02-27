import { Suspense } from 'react'
import { EventDetailSkeleton } from '@/components/skeletons/EventDetailSkeleton'
import { DetailPageClient } from './detail-page-client'

export const dynamic = 'force-dynamic'

export default function DetailPage() {
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <DetailPageClient />
    </Suspense>
  )
}
