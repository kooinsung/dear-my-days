'use client'

import { Ssgoi } from '@ssgoi/react'
import { useEffect, useMemo } from 'react'
import { transitionConfig } from './ssgoi-config'

export function SsgoiProvider({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => transitionConfig, [])

  // 브라우저 View Transitions API 지원 확인
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const supported = 'startViewTransition' in document
      console.log('[SSGOI] View Transitions API supported:', supported)
      if (!supported) {
        console.warn(
          '[SSGOI] View Transitions API not supported. Animations will be disabled.',
        )
      } else {
        console.log('[SSGOI] Provider initialized with config:', config)
      }
    }
  }, [config])

  return <Ssgoi config={config}>{children}</Ssgoi>
}
