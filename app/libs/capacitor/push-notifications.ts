'use client'

import type { Token } from '@capacitor/push-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import { getPlatform, isNativeSync } from './platform'

/**
 * 푸시 알림 권한 요청
 */
export async function requestPushPermissions(): Promise<boolean> {
  if (!isNativeSync()) {
    return false
  }

  try {
    const result = await PushNotifications.requestPermissions()
    return result.receive === 'granted'
  } catch (error) {
    console.error('Failed to request push permissions:', error)
    return false
  }
}

/**
 * 푸시 알림 등록 및 토큰 저장
 */
export async function registerPushNotifications(userId: string): Promise<void> {
  if (!isNativeSync()) {
    console.log('Push notifications are only available in native app')
    return
  }

  try {
    // 1. 권한 요청
    const granted = await requestPushPermissions()
    if (!granted) {
      console.log('Push notification permission denied')
      return
    }

    // 2. 푸시 토큰 등록
    await PushNotifications.register()

    // 3. 토큰 수신 리스너
    await PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        console.log('Push token:', token.value)

        // 4. 토큰을 서버에 저장
        try {
          const platform = await getPlatform()
          const response = await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              platform,
              token: token.value,
            }),
          })

          if (!response.ok) {
            console.error('Failed to register push token')
          }
        } catch (error) {
          console.error('Failed to save push token:', error)
        }
      },
    )

    // 5. 토큰 등록 실패 리스너
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
    })

    // 6. 푸시 알림 수신 리스너 (앱이 foreground일 때)
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received:', notification)
        // TODO: Toast 표시 또는 UI 업데이트
      },
    )

    // 7. 푸시 알림 클릭 리스너
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push action:', notification)

        // 이벤트 상세 페이지로 이동
        const eventId = notification.notification.data?.eventId
        if (eventId) {
          window.location.href = `/event/detail/${eventId}`
        }
      },
    )
  } catch (error) {
    console.error('Failed to register push notifications:', error)
  }
}

/**
 * 푸시 알림 해제
 */
export async function unregisterPushNotifications(
  userId: string,
): Promise<void> {
  if (!isNativeSync()) {
    return
  }

  try {
    // 서버에서 토큰 삭제
    const platform = await getPlatform()
    await fetch('/api/notifications/unregister-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        platform,
      }),
    })

    // 리스너 제거
    await PushNotifications.removeAllListeners()
  } catch (error) {
    console.error('Failed to unregister push notifications:', error)
  }
}

/**
 * 현재 푸시 알림 권한 상태 확인
 */
export async function checkPushPermissions(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  if (!isNativeSync()) {
    return 'denied'
  }

  try {
    const result = await PushNotifications.checkPermissions()
    return result.receive
  } catch (error) {
    console.error('Failed to check push permissions:', error)
    return 'denied'
  }
}
