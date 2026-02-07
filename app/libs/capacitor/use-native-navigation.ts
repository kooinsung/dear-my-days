'use client'

import { App } from '@capacitor/app'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isNativeSync } from './platform'

/**
 * 네이티브 뒤로가기 버튼 처리
 */
export function useNativeBackButton() {
  const router = useRouter()

  useEffect(() => {
    if (!isNativeSync()) {
      return
    }

    // Android 뒤로가기 버튼 감지
    const listener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        router.back()
      } else {
        // 최상위 페이지에서 뒤로가기 시 앱 종료 확인
        App.exitApp()
      }
    })

    return () => {
      listener.remove()
    }
  }, [router])
}

/**
 * 앱 상태 변화 감지 (foreground/background)
 */
export function useAppState(onActive?: () => void, onInactive?: () => void) {
  useEffect(() => {
    if (!isNativeSync()) {
      return
    }

    const stateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        onActive?.()
      } else {
        onInactive?.()
      }
    })

    return () => {
      stateListener.remove()
    }
  }, [onActive, onInactive])
}
