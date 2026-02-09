'use client'

import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { useDeepLinks } from './deep-link'
import { isNativeSync } from './platform'
import { useAppState, useNativeBackButton } from './use-native-navigation'

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

  // Status Bar 스타일 설정
  useEffect(() => {
    if (isNativeSync()) {
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
