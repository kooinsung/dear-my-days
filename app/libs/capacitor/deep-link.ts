'use client'

import { App, type URLOpenListenerEvent } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// App Links 도메인 (운영 도메인 확정 시 추가)
const APP_LINK_HOSTS = [
  'dear-my-days-dev.vercel.app',
  'dear-my-days.vercel.app',
]

function parseDeepLinkPath(url: URL): string | null {
  // Custom URL Scheme: dearmydays://path
  if (url.protocol === 'dearmydays:') {
    const fullPath = url.hostname
      ? `/${url.hostname}${url.pathname}`
      : url.pathname || '/'
    return fullPath + url.search
  }

  // App Links: https://dear-my-days-dev.vercel.app/path
  if (APP_LINK_HOSTS.includes(url.host)) {
    return url.pathname + url.search
  }

  return null
}

/**
 * 딥링크 URL 처리
 * - Custom Scheme: dearmydays://calendar → /calendar
 * - App Links: https://dear-my-days-dev.vercel.app/calendar → /calendar
 */
export function useDeepLinks() {
  const router = useRouter()

  useEffect(() => {
    let listenerHandle: PluginListenerHandle | null = null

    const setupListeners = async () => {
      // 앱이 실행 중일 때 딥링크 수신
      listenerHandle = await App.addListener(
        'appUrlOpen',
        (event: URLOpenListenerEvent) => {
          const path = parseDeepLinkPath(new URL(event.url))
          if (path) {
            router.push(path)
          }
        },
      )

      // 앱이 종료된 상태에서 딥링크로 실행된 경우
      const result = await App.getLaunchUrl()
      if (result?.url) {
        const path = parseDeepLinkPath(new URL(result.url))
        if (path) {
          router.push(path)
        }
      }
    }

    setupListeners()

    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [router])
}
