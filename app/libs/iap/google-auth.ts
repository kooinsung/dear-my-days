import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { importPKCS8, SignJWT } from 'jose'
import { env } from '@/libs/config/env'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ANDROID_PUBLISHER_SCOPE =
  'https://www.googleapis.com/auth/androidpublisher'

let cachedAccessToken: { token: string; expiresAt: number } | null = null

/**
 * Google Play Developer API용 액세스 토큰을 동적으로 생성 (캐싱 포함)
 */
export async function getGooglePlayAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token
  }

  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Google Service Account credentials not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)',
    )
  }

  const formattedKey = privateKey
    .replace(/\\n/g, '\n')
    .replace(/^["']|["']$/g, '')
    .trim()

  const key = await importPKCS8(formattedKey, 'RS256')

  const jwt = await new SignJWT({
    scope: ANDROID_PUBLISHER_SCOPE,
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
    Sentry.captureMessage('[IAP] Google OAuth2 token exchange failed', {
      level: 'error',
      extra: { status: response.status, errorText, clientEmail },
    })
    throw new Error(`Failed to get Google Play access token: ${errorText}`)
  }

  const data = await response.json()

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}
