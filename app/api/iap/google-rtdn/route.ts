import * as Sentry from '@sentry/nextjs'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { env } from '@/libs/config/env'
import { getGooglePlayAccessToken } from '@/libs/iap/google-auth'
import { sendSlackNotification } from '@/libs/slack/client'
import { formatIAPMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { handleApiError } from '@/libs/utils/errors'

// Google RTDN SubscriptionNotificationType
const SUBSCRIPTION_RECOVERED = 1
const SUBSCRIPTION_RENEWED = 2
// 3 = CANCELED (사용자 취소, 만료까지 사용 가능 → 로깅만)
const SUBSCRIPTION_REVOKED = 12
const SUBSCRIPTION_EXPIRED = 13

// Google RTDN OneTimeProductNotificationType
const ONE_TIME_PRODUCT_REFUNDED = 2

const NOTIFICATION_NAMES: Record<number, string> = {
  1: 'RECOVERED',
  2: 'RENEWED',
  3: 'CANCELED',
  4: 'PURCHASED',
  5: 'ON_HOLD',
  6: 'IN_GRACE_PERIOD',
  7: 'RESTARTED',
  8: 'PRICE_CHANGE_CONFIRMED',
  9: 'DEFERRED',
  10: 'PAUSED',
  11: 'PAUSE_SCHEDULE_CHANGED',
  12: 'REVOKED',
  13: 'EXPIRED',
}

async function fetchGoogleExpiryTime(
  purchaseToken: string,
): Promise<string | null> {
  try {
    const accessToken = await getGooglePlayAccessToken()
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${env.GOOGLE_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${purchaseToken}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      Sentry.captureMessage('[RTDN] Google API fetch failed', {
        level: 'error',
        extra: { status: response.status },
      })
      return null
    }

    const data = await response.json()
    return data.lineItems?.[0]?.expiryTime ?? null
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'fetchGoogleExpiryTime' },
    })
    return null
  }
}

async function handleSubscriptionRenewed(
  purchaseToken: string,
  subscriptionId: string,
) {
  const admin = supabaseAdmin()

  const { data: purchase } = await admin
    .from('event_purchases')
    .select('user_id, product_id, amount')
    .eq('purchase_token', purchaseToken)
    .single()

  if (!purchase) {
    Sentry.captureMessage('[RTDN] renewed - purchase not found', {
      level: 'warning',
      extra: { purchaseToken, subscriptionId },
    })
    return
  }

  // Google API로 새 만료일 조회
  const expiryTime = await fetchGoogleExpiryTime(purchaseToken)

  const { error: updateError } = await admin
    .from('user_plans')
    .update({
      expired_at: expiryTime ? new Date(expiryTime).toISOString() : null,
    })
    .eq('user_id', purchase.user_id)

  if (updateError) {
    Sentry.captureMessage('[RTDN] renewed - failed to update expired_at', {
      level: 'error',
      extra: {
        userId: purchase.user_id,
        expiryTime,
        error: updateError.message,
      },
    })
    return
  }

  Sentry.captureMessage('[RTDN] subscription renewed', {
    level: 'info',
    extra: {
      userId: purchase.user_id,
      subscriptionId,
      newExpiresAt: expiryTime,
    },
  })

  await sendSlackNotification(
    formatIAPMessage({
      type: 'subscription',
      provider: 'GOOGLE',
      productId: purchase.product_id,
      amount: purchase.amount,
      userId: purchase.user_id,
      transactionId: purchaseToken,
    }),
  )
}

async function handleSubscriptionExpired(
  purchaseToken: string,
  subscriptionId: string,
) {
  const admin = supabaseAdmin()

  // user_plans → FREE 다운그레이드 (purchase_token으로 유저 찾기)
  const { data: purchase } = await admin
    .from('event_purchases')
    .select('user_id, product_id')
    .eq('purchase_token', purchaseToken)
    .single()

  if (!purchase) {
    Sentry.captureMessage('[RTDN] expired - purchase not found', {
      level: 'warning',
      extra: { purchaseToken, subscriptionId },
    })
    return
  }

  await admin
    .from('user_plans')
    .update({ plan_type: 'FREE' })
    .eq('user_id', purchase.user_id)

  Sentry.captureMessage('[RTDN] subscription expired → FREE', {
    level: 'info',
    extra: {
      userId: purchase.user_id,
      subscriptionId,
    },
  })
}

async function handleSubscriptionRevoked(
  purchaseToken: string,
  subscriptionId: string,
) {
  const admin = supabaseAdmin()

  const { data: purchase, error: findError } = await admin
    .from('event_purchases')
    .select('id, user_id, product_id, amount')
    .eq('purchase_token', purchaseToken)
    .single()

  if (findError || !purchase) {
    Sentry.captureMessage('[RTDN] revoked - purchase not found', {
      level: 'warning',
      extra: { purchaseToken, subscriptionId, findError: findError?.message },
    })
    return
  }

  // event_purchases 환불 처리
  await admin
    .from('event_purchases')
    .update({
      status: 'REFUNDED',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchase.id)

  // user_plans → FREE 다운그레이드
  await admin
    .from('user_plans')
    .update({ plan_type: 'FREE' })
    .eq('user_id', purchase.user_id)

  Sentry.captureMessage('[RTDN] subscription revoked (refund) → FREE', {
    level: 'info',
    extra: {
      userId: purchase.user_id,
      purchaseId: purchase.id,
      subscriptionId,
    },
  })

  await sendSlackNotification(
    formatIAPMessage({
      type: 'refund',
      provider: 'GOOGLE',
      productId: purchase.product_id,
      amount: purchase.amount,
      userId: purchase.user_id,
      transactionId: purchaseToken,
    }),
  )
}

async function handleOneTimeRefund(purchaseToken: string, sku: string) {
  const admin = supabaseAdmin()

  const { data: purchase, error: findError } = await admin
    .from('event_purchases')
    .select('id, user_id, product_id, amount')
    .eq('purchase_token', purchaseToken)
    .single()

  if (findError || !purchase) {
    Sentry.captureMessage('[RTDN] one-time refund - purchase not found', {
      level: 'warning',
      extra: { purchaseToken, sku, findError: findError?.message },
    })
    return
  }

  // event_purchases 환불 처리
  await admin
    .from('event_purchases')
    .update({
      status: 'REFUNDED',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchase.id)

  // extra_event_slots 1 감소 (최소 0)
  const { data: currentPlan } = await admin
    .from('user_plans')
    .select('extra_event_slots')
    .eq('user_id', purchase.user_id)
    .single()

  const currentSlots = currentPlan?.extra_event_slots ?? 0
  if (currentSlots > 0) {
    await admin
      .from('user_plans')
      .update({ extra_event_slots: currentSlots - 1 })
      .eq('user_id', purchase.user_id)
  }

  Sentry.captureMessage('[RTDN] one-time product refunded', {
    level: 'info',
    extra: { userId: purchase.user_id, purchaseId: purchase.id, sku },
  })

  await sendSlackNotification(
    formatIAPMessage({
      type: 'refund',
      provider: 'GOOGLE',
      productId: purchase.product_id,
      amount: purchase.amount,
      userId: purchase.user_id,
      transactionId: purchaseToken,
    }),
  )
}

/**
 * Google Play Real-Time Developer Notifications (RTDN) 웹훅
 * Pub/Sub 메시지를 수신하여 환불/취소 처리
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body?.message?.data) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const decoded = Buffer.from(body.message.data, 'base64').toString()
    const data = JSON.parse(decoded)

    Sentry.addBreadcrumb({
      category: 'rtdn',
      message: 'RTDN received',
      level: 'info',
      data: {
        hasSubscription: !!data.subscriptionNotification,
        hasOneTime: !!data.oneTimeProductNotification,
      },
    })

    if (data.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } =
        data.subscriptionNotification

      Sentry.captureMessage('[RTDN] subscription notification', {
        level: 'info',
        extra: {
          notificationType,
          typeName: NOTIFICATION_NAMES[notificationType] ?? 'UNKNOWN',
          subscriptionId,
        },
      })

      if (
        notificationType === SUBSCRIPTION_RENEWED ||
        notificationType === SUBSCRIPTION_RECOVERED
      ) {
        // 자동 갱신 또는 복구 → 새 만료일로 업데이트
        await handleSubscriptionRenewed(purchaseToken, subscriptionId)
      } else if (notificationType === SUBSCRIPTION_EXPIRED) {
        // 구독 만료 → FREE 다운그레이드 (환불 아님)
        await handleSubscriptionExpired(purchaseToken, subscriptionId)
      } else if (notificationType === SUBSCRIPTION_REVOKED) {
        // 환불로 인한 취소 → FREE + REFUNDED 처리
        await handleSubscriptionRevoked(purchaseToken, subscriptionId)
      }
      // CANCELED(3): 사용자 취소, 만료까지는 사용 가능 → 로깅만
    }

    if (data.oneTimeProductNotification) {
      const { notificationType, purchaseToken, sku } =
        data.oneTimeProductNotification

      if (notificationType === ONE_TIME_PRODUCT_REFUNDED) {
        await handleOneTimeRefund(purchaseToken, sku)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return await handleApiError(error)
  }
}
