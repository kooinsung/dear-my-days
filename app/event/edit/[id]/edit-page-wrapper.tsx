'use client'

import { SsgoiTransition } from '@ssgoi/react'

export function EditPageWrapper({
  eventId,
  children,
}: {
  eventId: string
  children: React.ReactNode
}) {
  return (
    <SsgoiTransition id={`/event/edit/${eventId}`}>{children}</SsgoiTransition>
  )
}
