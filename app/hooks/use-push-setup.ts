'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { isNativeSync } from '@/libs/capacitor/platform'
import { registerPushNotifications } from '@/libs/capacitor/push-notifications'

/**
 * 네이티브 앱에서 인증된 사용자의 푸시 알림 토큰을 자동 등록하는 훅
 * - 네이티브 앱이 아니면 아무것도 하지 않음
 * - 이미 등록된 경우 중복 등록하지 않음
 */
export function usePushSetup() {
  const { user } = useAuth()
  const registered = useRef(false)

  useEffect(() => {
    if (!isNativeSync() || registered.current || !user) {
      return
    }

    registered.current = true
    registerPushNotifications(user.id)
  }, [user])
}
