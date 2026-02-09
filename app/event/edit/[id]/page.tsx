import { createSupabaseServer } from '@/libs/supabase/server'
import { EventEditPageClient } from './edit-page-client'
import { EditPageWrapper } from './edit-page-wrapper'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createSupabaseServer()
  void supabase

  return (
    <EditPageWrapper eventId={id}>
      <EventEditPageClient eventId={id} />
    </EditPageWrapper>
  )
}
