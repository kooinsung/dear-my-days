import { createSupabaseServer } from '@/libs/supabase/server'
import { EventNewPageClient } from './new-page-client'

export default async function NewEventPage() {
  const supabase = await createSupabaseServer()
  void supabase

  return <EventNewPageClient />
}
