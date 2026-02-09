'use client'

import { SsgoiTransition } from '@ssgoi/react'

export function ResetPasswordWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SsgoiTransition id="/auth/reset-password">{children}</SsgoiTransition>
}
