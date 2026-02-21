import { requireAuth } from '@/libs/auth/require-auth'
import { EventNewPageClient } from './new-page-client'

export default async function NewEventPage() {
  await requireAuth()

  return <EventNewPageClient />
}
