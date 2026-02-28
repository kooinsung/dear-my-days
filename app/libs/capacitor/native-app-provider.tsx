'use client'

import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { useDeepLinks } from './deep-link'
import { isNativeSync } from './platform'
import { useAppState, useNativeBackButton } from './use-native-navigation'

const FIRST_LAUNCH_KEY = 'dmd_first_launch_tracked'

function trackFirstLaunch() {
  if (!isNativeSync()) {
    return
  }
  if (localStorage.getItem(FIRST_LAUNCH_KEY)) {
    return
  }

  import('@capacitor/device').then(({ Device }) => {
    Promise.all([Device.getId(), Device.getInfo()]).then(([idResult, info]) => {
      fetch('/api/tracking/first-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: idResult.identifier,
          platform: info.platform === 'ios' ? 'ios' : 'android',
          deviceModel: info.model,
          osVersion: info.osVersion,
        }),
      })
        .then((res) => {
          if (res.ok) {
            localStorage.setItem(FIRST_LAUNCH_KEY, '1')
          }
        })
        .catch(() => {})
    })
  })
}

/**
 * Capacitor 네이티브 앱 통합 프로바이더
 * - 네이티브 뒤로가기 버튼 처리
 * - 딥링크 처리
 * - 앱 상태 변화 감지
 * - Status Bar 스타일 설정
 */
export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  // 네이티브 뒤로가기 버튼 처리
  useNativeBackButton()

  // 딥링크 처리
  useDeepLinks()

  // 앱 상태 변화 감지
  useAppState(
    () => {
      // Foreground: 세션 체크, 데이터 새로고침
      console.log('App became active')
    },
    () => {
      // Background: 리소스 정리
      console.log('App became inactive')
    },
  )

  // 첫 실행 트래킹
  useEffect(() => {
    trackFirstLaunch()
  }, [])

  // Status Bar 스타일 설정
  useEffect(() => {
    if (isNativeSync()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch((error) => {
        console.error('Failed to set status bar overlay:', error)
      })

      StatusBar.setStyle({ style: Style.Light }).catch((error) => {
        console.error('Failed to set status bar style:', error)
      })

      StatusBar.setBackgroundColor({ color: '#ffffff' }).catch((error) => {
        console.error('Failed to set status bar background:', error)
      })
    }
  }, [])

  return <>{children}</>
}
