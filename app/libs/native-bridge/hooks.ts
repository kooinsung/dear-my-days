'use client'

import { useEffect, useState } from 'react'
import { isNativeApp } from './core'
import type { NativeToWebMessage } from './types'

export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false)
  useEffect(() => {
    setIsNative(isNativeApp())
  }, [])
  return isNative
}

export function useNativeMessage(
  callback: (message: NativeToWebMessage) => void,
) {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as NativeToWebMessage
        callback(message)
      } catch {
        // Ignore non-JSON messages
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [callback])
}

export function usePlatformInfo(): 'ios' | 'android' | 'web' {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web')

  useEffect(() => {
    if (!isNativeApp()) {
      setPlatform('web')
      return
    }

    // 네이티브 앱에게 플랫폼 정보 요청
    const handler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as NativeToWebMessage
        if (message.type === 'PLATFORM_INFO_RESPONSE') {
          setPlatform(message.platform)
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener('message', handler)

    // 플랫폼 정보 요청
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'PLATFORM_INFO' }),
      )
    }

    return () => window.removeEventListener('message', handler)
  }, [])

  return platform
}
