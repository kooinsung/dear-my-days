'use client'

import { SsgoiTransition } from '@ssgoi/react'

export function CalendarPageContent({
  children,
}: {
  children: React.ReactNode
}) {
  return <SsgoiTransition id="/calendar">{children}</SsgoiTransition>
}
