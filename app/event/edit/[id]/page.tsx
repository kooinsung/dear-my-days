import { requireAuth } from '@/libs/auth/require-auth'
import { EventEditPageClient } from './edit-page-client'
import { EditPageWrapper } from './edit-page-wrapper'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await requireAuth()

  return (
    <EditPageWrapper eventId={id}>
      <EventEditPageClient eventId={id} />
    </EditPageWrapper>
  )
}
