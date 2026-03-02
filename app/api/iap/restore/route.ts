import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import {
  acknowledgeGooglePurchase,
  verifyAppleReceipt,
  verifyGoogleReceipt,
} from '@/libs/iap/verify'
import { sendSlackNotification } from '@/libs/slack/client'
import { formatIAPMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'
import type { PaymentProvider } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

// 상품 정보 매핑
const PRODUCT_INFO: Record<
  string,
  { amount: number; type: 'SUBSCRIPTION' | 'EVENT_SLOT'; planType?: string }
> = {
  'com.dearmydays.premium.monthly': {
    amount: 4900,
    type: 'SUBSCRIPTION',
    planType: 'PREMIUM_MONTHLY',
  },
  'com.dearmydays.premium.yearly': {
    amount: 49000,
    type: 'SUBSCRIPTION',
    planType: 'PREMIUM_YEARLY',
  },
  'com.dearmydays.event.slot': { amount: 1900, type: 'EVENT_SLOT' },
}

/**
 * 구매 복원
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await req.json()
    const { receipt, transactionId, provider, productId } = body

    // 입력 검증
    if (!receipt || !transactionId || !provider) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 영수증 검증
    if (provider !== 'APPLE' && provider !== 'GOOGLE') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 },
      )
    }

    // productId로 구독/소모품 타입 결정
    const purchaseType =
      productId && PRODUCT_INFO[productId]?.type === 'EVENT_SLOT'
        ? 'EVENT_SLOT'
        : 'SUBSCRIPTION'

    const verificationResult =
      provider === 'APPLE'
        ? await verifyAppleReceipt(receipt, purchaseType)
        : await verifyGoogleReceipt(receipt, productId, purchaseType)

    Sentry.captureMessage('[IAP] restore verify result', {
      level: verificationResult.isValid ? 'info' : 'error',
      extra: {
        provider,
        productId,
        purchaseType,
        userId: user.id,
        isValid: verificationResult.isValid,
        error: verificationResult.error,
      },
    })

    if (!verificationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || 'Invalid receipt',
        },
        { status: 400 },
      )
    }

    // Google orderId가 있으면 transaction_id로 사용 (일관된 주문 ID)
    const finalTransactionId =
      provider === 'GOOGLE' && verificationResult.orderId
        ? verificationResult.orderId
        : transactionId

    // 이미 존재하는 거래인지 확인
    const { data: existingPurchase } = await admin
      .from('event_purchases')
      .select('id, user_id')
      .eq('transaction_id', finalTransactionId)
      .maybeSingle()

    // Google 구매 확인 (acknowledge) - 미확인 시 자동 환불됨
    if (provider === 'GOOGLE') {
      const acknowledged = await acknowledgeGooglePurchase(
        receipt,
        productId,
        purchaseType,
      )
      if (!acknowledged) {
        Sentry.captureMessage(
          '[IAP] restore Google acknowledge failed but continuing',
          {
            level: 'warning',
            extra: { productId, purchaseType, userId: user.id },
          },
        )
      }
    }

    const finalProductId = verificationResult.productId || productId
    const product = finalProductId ? PRODUCT_INFO[finalProductId] : undefined

    if (!product) {
      Sentry.captureMessage('[IAP] restore unknown product', {
        level: 'error',
        extra: { finalProductId, provider, userId: user.id },
      })
      return NextResponse.json(
        { success: false, error: 'Unknown product ID' },
        { status: 400 },
      )
    }

    if (existingPurchase) {
      // 다른 사용자의 거래인 경우 에러
      if (existingPurchase.user_id !== user.id) {
        Sentry.captureMessage(
          '[IAP] restore transaction belongs to another user',
          {
            level: 'warning',
            extra: {
              transactionId,
              requestUserId: user.id,
              ownerUserId: existingPurchase.user_id,
            },
          },
        )
        return NextResponse.json(
          { success: false, error: 'Transaction belongs to another user' },
          { status: 403 },
        )
      }

      // 같은 사용자의 거래인 경우 플랜 업데이트
      if (product.type === 'SUBSCRIPTION') {
        const { error: planError } = await admin.from('user_plans').upsert({
          user_id: user.id,
          plan_type: product.planType,
          started_at: new Date().toISOString(),
          expired_at: verificationResult.expiresAt?.toISOString() || null,
        })

        if (planError) {
          Sentry.captureMessage('[IAP] restore failed to update plan', {
            level: 'error',
            extra: {
              userId: user.id,
              planType: product.planType,
              planError: planError.message,
            },
          })
          return NextResponse.json(
            { success: false, error: 'Failed to restore subscription' },
            { status: 500 },
          )
        }
      }

      await sendSlackNotification(
        formatIAPMessage({
          type: 'restore',
          provider,
          productId: finalProductId,
          amount: product.amount,
          userId: user.id,
          transactionId,
        }),
      )

      return successResponse({
        restored: true,
        transactionId,
        expiresAt: verificationResult.expiresAt,
      })
    }

    // user_plans 먼저 업데이트
    if (product.type === 'SUBSCRIPTION') {
      const { error: planError } = await admin.from('user_plans').upsert({
        user_id: user.id,
        plan_type: product.planType,
        started_at: new Date().toISOString(),
        expired_at: verificationResult.expiresAt?.toISOString() || null,
      })

      if (planError) {
        Sentry.captureMessage('[IAP] restore failed to update plan (new)', {
          level: 'error',
          extra: {
            userId: user.id,
            planType: product.planType,
            planError: planError.message,
          },
        })
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription' },
          { status: 500 },
        )
      }
    } else if (product.type === 'EVENT_SLOT') {
      const { error: slotError } = await admin.rpc('increment_event_slots', {
        user_id_param: user.id,
        increment_by: 1,
      })

      if (slotError) {
        Sentry.captureMessage(
          '[IAP] restore increment_event_slots RPC failed, using fallback',
          {
            level: 'warning',
            extra: { userId: user.id, slotError: slotError.message },
          },
        )

        const { data: currentPlan } = await admin
          .from('user_plans')
          .select('extra_event_slots, plan_type')
          .eq('user_id', user.id)
          .single()

        const currentSlots = currentPlan?.extra_event_slots || 0
        const currentPlanType = currentPlan?.plan_type ?? 'FREE'

        const { error: updateError } = await admin.from('user_plans').upsert({
          user_id: user.id,
          plan_type: currentPlanType,
          extra_event_slots: currentSlots + 1,
        })

        if (updateError) {
          Sentry.captureMessage(
            '[IAP] restore failed to update event slots (fallback)',
            {
              level: 'error',
              extra: {
                userId: user.id,
                currentSlots,
                currentPlanType,
                updateError: updateError.message,
              },
            },
          )
          return NextResponse.json(
            { success: false, error: 'Failed to add event slot' },
            { status: 500 },
          )
        }
      }
    }

    // event_purchases에 구매 기록
    const { error: purchaseError } = await admin
      .from('event_purchases')
      .insert({
        user_id: user.id,
        provider: provider as PaymentProvider,
        transaction_id: finalTransactionId,
        product_id: finalProductId,
        purchase_type: product.type,
        amount: product.amount,
        currency: 'KRW',
        purchase_token: receipt,
      })

    if (purchaseError) {
      Sentry.captureMessage('[IAP] restore failed to insert purchase record', {
        level: 'error',
        extra: {
          userId: user.id,
          transactionId: finalTransactionId,
          finalProductId,
          purchaseError: purchaseError.message,
        },
      })
    }

    await sendSlackNotification(
      formatIAPMessage({
        type: 'restore',
        provider,
        productId: finalProductId,
        amount: product.amount,
        userId: user.id,
        transactionId,
      }),
    )

    return successResponse({
      restored: true,
      transactionId,
      expiresAt: verificationResult.expiresAt,
    })
  } catch (error) {
    return await handleApiError(error)
  }
}
