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

    if (existingPurchase) {
      // 다른 사용자의 거래인 경우 에러
      if (existingPurchase.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Transaction belongs to another user' },
          { status: 403 },
        )
      }

      // 같은 사용자의 거래인 경우 플랜만 업데이트
      const { error: planError } = await admin.from('user_plans').upsert({
        user_id: user.id,
        plan_type: 'PREMIUM',
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

      return successResponse({
        restored: true,
        transactionId,
        expiresAt: verificationResult.expiresAt,
      })
    }

    // 새 거래로 기록
    const priceMap: Record<string, number> = {
      'com.dearmydays.premium.monthly': 4900,
      'com.dearmydays.premium.yearly': 49000,
      'com.dearmydays.enterprise': 99000,
    }

    const amount =
      priceMap[verificationResult.productId || ''] || priceMap[productId] || 0

    const { error: purchaseError } = await admin
      .from('event_purchases')
      .insert({
        user_id: user.id,
        provider: provider as PaymentProvider,
        transaction_id: transactionId,
        amount,
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

    // 플랜 업데이트
    const { error: planError } = await admin.from('user_plans').upsert({
      user_id: user.id,
      plan_type: 'PREMIUM',
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

    return successResponse({
      restored: true,
      transactionId,
      expiresAt: verificationResult.expiresAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
