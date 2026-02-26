// Supabase Edge Function for sending scheduled notifications
// Deploy: supabase functions deploy send-scheduled-notifications
//
// Required env vars (set via Supabase Dashboard > Edge Functions > Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@5'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')
const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')

// --- Firebase Access Token (JWT → OAuth2) ---

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

let cachedAccessToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  if (!firebasePrivateKey || !firebaseClientEmail) {
    throw new Error('Firebase credentials not configured')
  }

  const key = await importPKCS8(
    firebasePrivateKey.replace(/\\n/g, '\n'),
    'RS256',
  )

  const jwt = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(firebaseClientEmail)
    .setSubject(firebaseClientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get Firebase access token: ${errorText}`)
  }

  const data = await response.json()

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

// --- FCM Send ---

type FcmResult = {
  token: string
  success: boolean
  messageId?: string
  error?: string
}

async function sendFcmMessage(params: {
  token: string
  platform: string
  title: string
  body: string
  data?: Record<string, string>
}): Promise<FcmResult> {
  const accessToken = await getAccessToken()

  const message: Record<string, unknown> = {
    token: params.token,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: params.data,
    android: {
      priority: 'high',
      notification: {
        channel_id: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { token: params.token, success: false, error: errorText }
  }

  const result = await response.json()
  return { token: params.token, success: true, messageId: result.name }
}

// --- Notification Message Builder ---

const CATEGORY_LABELS: Record<string, string> = {
  BIRTHDAY: '생일',
  ANNIVERSARY: '기념일',
  MEMORIAL: '기일',
  HOLIDAY: '공휴일',
  OTHER: '이벤트',
}

function buildNotificationMessage(
  eventTitle: string,
  daysBefore: number,
  category?: string,
): { title: string; body: string } {
  const categoryLabel = CATEGORY_LABELS[category ?? ''] ?? '이벤트'

  if (daysBefore === 0) {
    return {
      title: `오늘은 ${eventTitle}`,
      body: `오늘은 ${eventTitle} 입니다. 잊지 마세요!`,
    }
  }

  if (daysBefore === 1) {
    return {
      title: `내일은 ${eventTitle}`,
      body: `내일은 ${eventTitle} 입니다. 준비하세요!`,
    }
  }

  return {
    title: `${categoryLabel} 알림`,
    body: `${eventTitle}이(가) ${daysBefore}일 후입니다.`,
  }
}

// --- Main Handler ---

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // KST (UTC+9) 기준 현재 시간
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kst = new Date(now.getTime() + kstOffset)
    const currentHour = kst.getUTCHours()
    const currentMinute = kst.getUTCMinutes()

    console.log(
      `Checking notifications for KST ${currentHour}:${String(currentMinute).padStart(2, '0')}`,
    )

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

    // Firebase 미설정 시 로그만 출력
    if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
      console.warn('Firebase not configured. Logging notifications only:')
      for (const n of pendingNotifications) {
        console.log(
          `  [SKIP] user=${n.user_id} event="${n.event_title}" tokens=${n.device_tokens?.length}`,
        )
      }
      return new Response(
        JSON.stringify({
          success: false,
          processed: 0,
          message: 'Firebase not configured',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // FCM 발송
    const results: Array<{
      user_id: string
      event_id: string
      fcm: FcmResult[]
    }> = []

    for (const notification of pendingNotifications) {
      const {
        user_id,
        event_id,
        event_title,
        event_category,
        days_before,
        device_tokens,
      } = notification

      const { title, body } = buildNotificationMessage(
        event_title,
        days_before ?? 0,
        event_category,
      )

      const fcmResults: FcmResult[] = []

      for (const device of device_tokens) {
        const fcmResult = await sendFcmMessage({
          token: device.token,
          platform: device.platform,
          title,
          body,
          data: { eventId: event_id },
        })

        fcmResults.push(fcmResult)

        // 발송 로그 기록
        await supabase.from('notification_logs').insert({
          user_id,
          event_id,
          device_token: device.token,
          sent_at: new Date().toISOString(),
          status: fcmResult.success ? 'SUCCESS' : 'FAILED',
          error_message: fcmResult.error ?? null,
        })

        console.log(
          `${fcmResult.success ? '✓' : '✗'} user=${user_id} event="${event_title}" token=${device.token.slice(0, 12)}...`,
        )
      }

      results.push({ user_id, event_id, fcm: fcmResults })
    }

    const totalSent = results.reduce(
      (sum, r) => sum + r.fcm.filter((f) => f.success).length,
      0,
    )
    const totalFailed = results.reduce(
      (sum, r) => sum + r.fcm.filter((f) => !f.success).length,
      0,
    )

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingNotifications.length,
        sent: totalSent,
        failed: totalFailed,
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
