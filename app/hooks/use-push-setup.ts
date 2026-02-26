'use client'

import { useEffect, useRef } from 'react'
import { isNativeSync } from '@/libs/capacitor/platform'
import { registerPushNotifications } from '@/libs/capacitor/push-notifications'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

/**
 * 네이티브 앱에서 인증된 사용자의 푸시 알림 토큰을 자동 등록하는 훅
 * - 네이티브 앱이 아니면 아무것도 하지 않음
 * - 이미 등록된 경우 중복 등록하지 않음
 */
export function usePushSetup() {
  const registered = useRef(false)

  useEffect(() => {
    if (!isNativeSync() || registered.current) {
      return
    }

    const setup = async () => {
      try {
        const supabase = createSupabaseBrowser()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return
        }

        registered.current = true
        await registerPushNotifications(user.id)
      } catch (error) {
        console.error('Push setup failed:', error)
      }
    }

    setup()
  }, [])
}
