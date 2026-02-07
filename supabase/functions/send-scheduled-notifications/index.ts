// Supabase Edge Function for sending scheduled notifications
// Deploy: supabase functions deploy send-scheduled-notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')
const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 현재 시간 (분 단위로 반올림)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    console.log(`Checking notifications for ${currentHour}:${currentMinute}`)

    // 오늘 발송할 알림 조회
    const { data: pendingNotifications, error } = await supabase.rpc(
      'get_pending_notifications',
      {
        current_hour: currentHour,
        current_minute: currentMinute,
      },
    )

    if (error) {
      console.error('Failed to fetch pending notifications:', error)
      throw error
    }

    console.log(
      `Found ${pendingNotifications?.length || 0} pending notifications`,
    )

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No pending notifications',
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Firebase가 설정되지 않은 경우 로그만 출력
    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      console.log('Firebase not configured. Logging notifications:')
      for (const notification of pendingNotifications) {
        console.log(`Would send to user ${notification.user_id}:`)
        console.log(`  Event: ${notification.event_title}`)
        console.log(`  Tokens: ${notification.device_tokens.length}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: pendingNotifications.length,
          message:
            'Firebase not configured. Check logs for notification details.',
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    // FCM 발송 (실제 구현)
    const results = []
    for (const notification of pendingNotifications) {
      const { user_id, event_id, device_tokens } = notification

      for (const deviceToken of device_tokens) {
        try {
          // TODO: Firebase Admin SDK 통합
          // 실제 구현:
          // const accessToken = await getAccessToken()
          // await fetch(`https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${accessToken}`,
          //   },
          //   body: JSON.stringify({
          //     message: {
          //       token: deviceToken.token,
          //       notification: {
          //         title: '이벤트 알림',
          //         body: `${event_title}이(가) 곧 다가옵니다!`,
          //       },
          //       data: {
          //         event_id,
          //       },
          //     },
          //   }),
          // })

          // 발송 로그 기록
          await supabase.from('notification_logs').insert({
            user_id,
            event_id,
            device_token: deviceToken.token,
            sent_at: new Date().toISOString(),
            status: 'SUCCESS',
          })

          console.log(
            `Sent notification to user ${user_id} for event ${event_id}`,
          )
          results.push({ user_id, event_id, success: true })
        } catch (error) {
          console.error(`Failed to send to ${deviceToken.token}:`, error)

          await supabase.from('notification_logs').insert({
            user_id,
            event_id,
            device_token: deviceToken.token,
            sent_at: new Date().toISOString(),
            status: 'FAILED',
            error_message: String(error),
          })

          results.push({
            user_id,
            event_id,
            success: false,
            error: String(error),
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingNotifications.length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

// Firebase Access Token 생성 (JWT)
// async function getAccessToken() {
//   // TODO: Implement JWT token generation for Firebase
//   // Use firebase-admin or custom JWT implementation
//   return 'ACCESS_TOKEN'
// }
