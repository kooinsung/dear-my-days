import { type NextRequest, NextResponse } from 'next/server'
import { verifyAppleReceipt, verifyGoogleReceipt } from '@/libs/iap/verify'
import { supabaseAdmin } from '@/libs/supabase/admin'
import type { PaymentProvider } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 구독 복원
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

    // 이미 존재하는 거래인지 확인
    const { data: existingPurchase } = await admin
      .from('event_purchases')
      .select('id, user_id')
      .eq('transaction_id', transactionId)
      .single()

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

    if (existingPurchase) {
      // 다른 사용자의 거래인 경우 에러
      if (existingPurchase.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Transaction belongs to another user' },
          { status: 403 },
        )
      }

      // 같은 사용자의 거래인 경우 플랜 또는 슬롯 업데이트
      if (product.type === 'SUBSCRIPTION') {
        const { error: planError } = await admin.from('user_plans').upsert({
          user_id: user.id,
          plan_type: product.planType,
          started_at: new Date().toISOString(),
          expired_at: verificationResult.expiresAt?.toISOString() || null,
        })

        if (planError) {
          console.error('Failed to restore plan:', planError)
          return NextResponse.json(
            { success: false, error: 'Failed to restore subscription' },
            { status: 500 },
          )
        }
      } else if (product.type === 'EVENT_SLOT') {
        // 이벤트 슬롯은 이미 구매 기록이 있으므로 별도 처리 불필요
        // 필요시 extra_event_slots를 다시 확인하고 동기화
      }

      return successResponse({
        restored: true,
        transactionId,
        expiresAt: verificationResult.expiresAt,
      })
    }

    // 새 거래로 기록
    const { error: purchaseError } = await admin
      .from('event_purchases')
      .insert({
        user_id: user.id,
        provider: provider as PaymentProvider,
        transaction_id: transactionId,
        product_id: finalProductId,
        purchase_type: product.type,
        amount: product.amount,
        currency: 'KRW',
        purchased_at: new Date().toISOString(),
      })

    if (purchaseError) {
      console.error('Failed to insert restored purchase:', purchaseError)
      return NextResponse.json(
        { success: false, error: 'Failed to record purchase' },
        { status: 500 },
      )
    }

    // 구독 또는 이벤트 슬롯에 따라 처리
    if (product.type === 'SUBSCRIPTION') {
      // 구독: user_plans 테이블 업데이트
      const { error: planError } = await admin.from('user_plans').upsert({
        user_id: user.id,
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
        user_id_param: user.id,
        increment_by: 1,
      })

      if (slotError) {
        // RPC 함수가 없으면 직접 업데이트
        const { data: currentPlan } = await admin
          .from('user_plans')
          .select('extra_event_slots')
          .eq('user_id', user.id)
          .single()

        const currentSlots = currentPlan?.extra_event_slots || 0

        const { error: updateError } = await admin.from('user_plans').upsert({
          user_id: user.id,
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
      restored: true,
      transactionId,
      expiresAt: verificationResult.expiresAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
