'use client'

import { SsgoiTransition } from '@ssgoi/react'

export function VerifyEmailWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SsgoiTransition id="/auth/verify-email">{children}</SsgoiTransition>
}
