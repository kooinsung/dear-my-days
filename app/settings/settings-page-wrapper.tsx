'use client'

import { SsgoiTransition } from '@ssgoi/react'

export function SettingsPageWrapper({
  pageId,
  children,
}: {
  pageId: string
  children: React.ReactNode
}) {
  return <SsgoiTransition id={pageId}>{children}</SsgoiTransition>
}
