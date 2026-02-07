'use client'

import { App, type URLOpenListenerEvent } from '@capacitor/app'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 딥링크 URL 처리
 * 예: dearmydays://calendar → /calendar
 */
export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    // 앱이 실행 중일 때 딥링크 수신
    const listener = App.addListener(
      'appUrlOpen',
      (event: URLOpenListenerEvent) => {
        const url = new URL(event.url)

        // Custom URL Scheme: dearmydays://path
        if (url.protocol === 'dearmydays:') {
          const path = url.pathname || '/'
          router.push(path)
        }

        // Universal Link: https://dearmydays.com/path
        if (url.host === 'dearmydays.com') {
          router.push(url.pathname + url.search)
        }
      },
    )

    // 앱이 종료된 상태에서 딥링크로 실행된 경우
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        const url = new URL(result.url)
        if (url.protocol === 'dearmydays:' || url.host === 'dearmydays.com') {
          router.push(url.pathname)
        }
      }
    })

    return () => {
      listener.remove()
    }
  }, [router])
}
