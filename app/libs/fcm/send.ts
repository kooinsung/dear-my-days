import 'server-only'
import { importPKCS8, SignJWT } from 'jose'
import { env } from '@/libs/config/env'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

let cachedAccessToken: { token: string; expiresAt: number } | null = null

/**
 * Firebase 서비스 계정의 JWT를 생성하고 Google OAuth2 액세스 토큰을 받아옴
 */
async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  const clientEmail = env.FIREBASE_CLIENT_EMAIL
  const privateKey = env.FIREBASE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials not configured (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)',
    )
  }

  const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'RS256')

  const jwt = await new SignJWT({
    scope: FCM_SCOPE,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
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
    throw new Error(`Failed to get access token: ${errorText}`)
  }

  const data = await response.json()

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

type FcmSendResult = {
  token: string
  success: boolean
  messageId?: string
  error?: string
}

/**
 * FCM HTTP v1 API로 단일 디바이스에 푸시 발송
 */
export async function sendFcmMessage(params: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}): Promise<FcmSendResult> {
  const projectId = env.FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID not configured')
  }

  const accessToken = await getAccessToken()

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
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
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    return {
      token: params.token,
      success: false,
      error: errorText,
    }
  }

  const result = await response.json()
  return {
    token: params.token,
    success: true,
    messageId: result.name,
  }
}

/**
 * 여러 디바이스에 동일한 알림 발송
 */
export async function sendFcmToDevices(params: {
  tokens: Array<{ token: string; platform: string }>
  title: string
  body: string
  data?: Record<string, string>
}): Promise<FcmSendResult[]> {
  const results = await Promise.allSettled(
    params.tokens.map((device) =>
      sendFcmMessage({
        token: device.token,
        title: params.title,
        body: params.body,
        data: params.data,
      }),
    ),
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      token: params.tokens[i].token,
      success: false,
      error: String(result.reason),
    }
  })
}
