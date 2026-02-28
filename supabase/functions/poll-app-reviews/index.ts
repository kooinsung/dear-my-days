// Supabase Edge Function for polling App Store / Google Play reviews
// Deploy: supabase functions deploy poll-app-reviews
// Cron: 0 */6 * * * (every 6 hours)
//
// Required env vars (set via Supabase Dashboard > Edge Functions > Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SLACK_WEBHOOK_URL
//   Apple: APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_APP_ID
//   Google: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, GOOGLE_PACKAGE_NAME

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@5'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')

// --- Apple App Store Connect API ---

async function getAppleJwt(): Promise<string | null> {
  const issuerId = Deno.env.get('APPLE_ISSUER_ID')
  const keyId = Deno.env.get('APPLE_KEY_ID')
  const privateKeyRaw = Deno.env.get('APPLE_PRIVATE_KEY')

  if (!issuerId || !keyId || !privateKeyRaw) {
    return null
  }

  let pem = privateKeyRaw
    .replace(/\\n/g, '\n')
    .replace(/^["']|["']$/g, '')
    .trim()

  if (!pem.startsWith('-----BEGIN PRIVATE KEY-----')) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`
  }

  const key = await importPKCS8(pem, 'ES256')

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setAudience('appstoreconnect-v1')
    .setIssuedAt()
    .setExpirationTime('20m')
    .sign(key)
}

type Review = {
  store: string
  rating: number
  title?: string
  body?: string
  author?: string
  createdAt: string
}

async function fetchAppleReviews(since: string): Promise<Review[]> {
  const appId = Deno.env.get('APPLE_APP_ID')
  const jwt = await getAppleJwt()
  if (!jwt || !appId) {
    return []
  }

  const url = `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews?sort=-createdDate&limit=50`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${jwt}` },
  })

  if (!response.ok) {
    console.error('Apple reviews API error:', await response.text())
    return []
  }

  const data = await response.json()
  const sinceDate = new Date(since)

  return (data.data ?? [])
    .filter(
      (r: { attributes: { createdDate: string } }) =>
        new Date(r.attributes.createdDate) > sinceDate,
    )
    .map(
      (r: {
        attributes: {
          rating: number
          title: string
          body: string
          reviewerNickname: string
          createdDate: string
        }
      }) => ({
        store: 'apple',
        rating: r.attributes.rating,
        title: r.attributes.title,
        body: r.attributes.body,
        author: r.attributes.reviewerNickname,
        createdAt: r.attributes.createdDate,
      }),
    )
}

// --- Google Play Developer API ---

async function getGoogleAccessToken(): Promise<string | null> {
  const saJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
  if (!saJson) {
    return null
  }

  const sa = JSON.parse(saJson)
  const key = await importPKCS8(sa.private_key, 'RS256')

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/androidpublisher',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data.access_token
}

async function fetchGoogleReviews(since: string): Promise<Review[]> {
  const packageName = Deno.env.get('GOOGLE_PACKAGE_NAME')
  const accessToken = await getGoogleAccessToken()
  if (!accessToken || !packageName) {
    return []
  }

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/reviews`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    console.error('Google reviews API error:', await response.text())
    return []
  }

  const data = await response.json()
  const sinceDate = new Date(since)

  return (data.reviews ?? [])
    .filter(
      (r: {
        comments: Array<{ userComment: { lastModified: { seconds: string } } }>
      }) => {
        const ts = r.comments?.[0]?.userComment?.lastModified?.seconds
        return ts && new Date(Number(ts) * 1000) > sinceDate
      },
    )
    .map(
      (r: {
        authorName: string
        comments: Array<{
          userComment: {
            starRating: number
            text: string
            lastModified: { seconds: string }
          }
        }>
      }) => {
        const comment = r.comments[0].userComment
        return {
          store: 'google',
          rating: comment.starRating,
          body: comment.text,
          author: r.authorName,
          createdAt: new Date(
            Number(comment.lastModified.seconds) * 1000,
          ).toISOString(),
        }
      },
    )
}

// --- Slack ---

function formatReviewBlock(review: Review) {
  const stars = '⭐'.repeat(review.rating)
  const storeLabel =
    review.store === 'apple' ? '🍎 App Store' : '🤖 Google Play'
  const fields = [
    { type: 'mrkdwn', text: `*스토어:*\n${storeLabel}` },
    {
      type: 'mrkdwn',
      text: `*평점:*\n${stars} (${review.rating}/5)`,
    },
  ]
  if (review.author) {
    fields.push({ type: 'mrkdwn', text: `*작성자:*\n${review.author}` })
  }

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📝 새 리뷰' },
    },
    { type: 'section', fields },
  ]
  if (review.title || review.body) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [review.title ? `*${review.title}*` : '', review.body ?? '']
          .filter(Boolean)
          .join('\n'),
      },
    })
  }
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      },
    ],
  })

  return { blocks }
}

async function sendSlack(message: Record<string, unknown>) {
  if (!slackWebhookUrl) {
    return
  }
  await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  }).catch(() => {})
}

// --- Main Handler ---

serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // kv_store에서 마지막 폴링 시간 가져오기
    const { data: kvRow } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', 'last_review_poll')
      .single()

    const since =
      kvRow?.value ?? new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    console.log(`Polling reviews since ${since}`)

    // Apple + Google 리뷰 동시 조회
    const [appleReviews, googleReviews] = await Promise.all([
      fetchAppleReviews(since).catch((e) => {
        console.error('Apple review fetch error:', e)
        return [] as Review[]
      }),
      fetchGoogleReviews(since).catch((e) => {
        console.error('Google review fetch error:', e)
        return [] as Review[]
      }),
    ])

    const allReviews = [...appleReviews, ...googleReviews]
    console.log(`Found ${allReviews.length} new reviews`)

    // Slack 알림 전송
    for (const review of allReviews) {
      await sendSlack(formatReviewBlock(review))
    }

    // 마지막 폴링 시간 업데이트
    const now = new Date().toISOString()
    await supabase.from('kv_store').upsert({
      key: 'last_review_poll',
      value: now,
      updated_at: now,
    })

    return new Response(
      JSON.stringify({
        success: true,
        apple: appleReviews.length,
        google: googleReviews.length,
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
