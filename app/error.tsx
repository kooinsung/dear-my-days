'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <div>예상치 못한 오류가 발생했습니다.</div>
}
