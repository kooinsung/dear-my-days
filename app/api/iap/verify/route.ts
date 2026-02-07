import { type NextRequest, NextResponse } from 'next/server'
import { verifyAppleReceipt, verifyGoogleReceipt } from '@/libs/iap/verify'
import { supabaseAdmin } from '@/libs/supabase/admin'
import type { PaymentProvider } from '@/libs/supabase/database.types'
import { handleApiError, successResponse } from '@/libs/utils/errors'

export async function POST(req: NextRequest) {
  try {
    const admin = supabaseAdmin()
    const body = await req.json()
    const { receipt, transactionId, provider, userId, productId } = body

    // 입력 검증
    if (!receipt || !transactionId || !provider || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    if (provider !== 'APPLE' && provider !== 'GOOGLE') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 },
      )
    }

    // 영수증 검증
    const verificationResult =
      provider === 'APPLE'
        ? await verifyAppleReceipt(receipt)
        : await verifyGoogleReceipt(receipt, productId)

    if (!verificationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || 'Invalid receipt',
        },
        { status: 400 },
      )
    }

    // 중복 거래 확인
    const { data: existingPurchase } = await admin
      .from('event_purchases')
      .select('id')
      .eq('transaction_id', transactionId)
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'Transaction already processed' },
        { status: 400 },
      )
    }

    // 상품 정보 매핑
    const productInfo: Record<
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
      'com.dearmydays.event.slot': { amount: 990, type: 'EVENT_SLOT' },
    }

    const finalProductId = verificationResult.productId || productId
    const product = productInfo[finalProductId]

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Unknown product ID' },
        { status: 400 },
      )
    }

    // event_purchases 테이블에 기록
    const { error: purchaseError } = await admin
      .from('event_purchases')
      .insert({
        user_id: userId,
        provider: provider as PaymentProvider,
        transaction_id: transactionId,
        product_id: finalProductId,
        purchase_type: product.type,
        amount: product.amount,
        currency: 'KRW',
        purchased_at: new Date().toISOString(),
      })

    if (purchaseError) {
      console.error('Failed to insert purchase:', purchaseError)
      return NextResponse.json(
        { success: false, error: 'Failed to record purchase' },
        { status: 500 },
      )
    }

    // 구독 또는 이벤트 슬롯에 따라 처리
    if (product.type === 'SUBSCRIPTION') {
      // 구독: user_plans 테이블 업데이트
      const { error: planError } = await admin.from('user_plans').upsert({
        user_id: userId,
        plan_type: product.planType,
        started_at: new Date().toISOString(),
        expired_at: verificationResult.expiresAt?.toISOString() || null,
      })

      if (planError) {
        console.error('Failed to update plan:', planError)
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription' },
          { status: 500 },
        )
      }
    } else if (product.type === 'EVENT_SLOT') {
      // 이벤트 슬롯: extra_event_slots 증가
      const { error: slotError } = await admin.rpc('increment_event_slots', {
        user_id_param: userId,
        increment_by: 1,
      })

      if (slotError) {
        // RPC 함수가 없으면 직접 업데이트
        const { data: currentPlan } = await admin
          .from('user_plans')
          .select('extra_event_slots')
          .eq('user_id', userId)
          .single()

        const currentSlots = currentPlan?.extra_event_slots || 0

        const { error: updateError } = await admin.from('user_plans').upsert({
          user_id: userId,
          plan_type: 'FREE',
          extra_event_slots: currentSlots + 1,
        })

        if (updateError) {
          console.error('Failed to update event slots:', updateError)
          return NextResponse.json(
            { success: false, error: 'Failed to add event slot' },
            { status: 500 },
          )
        }
      }
    }

    return successResponse({
      transactionId,
      expiresAt: verificationResult.expiresAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
