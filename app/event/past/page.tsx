import { Suspense } from 'react'
import { PastEventsSkeleton } from '@/components/skeletons/PastEventsSkeleton'
import { PastPageWrapper } from './past-page-wrapper'

export default function PastPage() {
  return (
    <Suspense fallback={<PastEventsSkeleton />}>
      <PastPageWrapper />
    </Suspense>
  )
}
