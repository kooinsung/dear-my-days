import { Suspense } from 'react'
import { PastEventsSkeleton } from '@/components/skeletons/PastEventsSkeleton'
import { PastPageWrapper } from './past-page-wrapper'

export const dynamic = 'force-dynamic'

export default function PastPage() {
  return (
    <Suspense fallback={<PastEventsSkeleton />}>
      <PastPageWrapper />
    </Suspense>
  )
}
