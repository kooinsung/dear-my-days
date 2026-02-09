'use client'

import { Ssgoi } from '@ssgoi/react'
import { useMemo } from 'react'
import { transitionConfig } from './ssgoi-config'

export function SsgoiProvider({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => transitionConfig, [])
  return <Ssgoi config={config}>{children}</Ssgoi>
}
