'use client'

import { ViewTransitions } from 'next-view-transitions'
import { useEffect } from 'react'

export function SsgoiProvider({ children }: { children: React.ReactNode }) {
  // 브라우저 View Transitions API 지원 확인
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const supported = 'startViewTransition' in document
      console.log('[ViewTransitions] API supported:', supported)
      if (!supported) {
        console.warn(
          '[ViewTransitions] API not supported in this browser. Animations will be disabled.',
        )
      }
    }
  }, [])

  return <ViewTransitions>{children}</ViewTransitions>
}
