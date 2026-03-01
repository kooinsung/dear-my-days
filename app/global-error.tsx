'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)

    fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${error.name}: ${error.message}`,
        url: window.location.href,
        source: 'global-error',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div>예상치 못한 오류가 발생했습니다.</div>
      </body>
    </html>
  )
}
