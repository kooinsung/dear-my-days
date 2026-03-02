import * as Sentry from '@sentry/nextjs'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { sendSlackNotification } from '@/libs/slack/client'
import { formatIAPMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { handleApiError } from '@/libs/utils/errors'

// Google RTDN SubscriptionNotificationType
const SUBSCRIPTION_REVOKED = 12
const SUBSCRIPTION_REFUNDED = 13

// Google RTDN OneTimeProductNotificationType
const ONE_TIME_PRODUCT_REFUNDED = 2

async function handleSubscriptionRefund(
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
    Sentry.captureMessage('[RTDN] subscription refund - purchase not found', {
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

  Sentry.captureMessage('[RTDN] subscription refunded', {
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

      if (
        notificationType === SUBSCRIPTION_REVOKED ||
        notificationType === SUBSCRIPTION_REFUNDED
      ) {
        await handleSubscriptionRefund(purchaseToken, subscriptionId)
      }
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
