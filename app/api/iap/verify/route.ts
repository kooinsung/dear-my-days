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

    // 상품 가격 매핑 (실제로는 상품 ID에 따라 다름)
    const priceMap: Record<string, number> = {
      'com.dearmydays.premium.monthly': 4900,
      'com.dearmydays.premium.yearly': 49000,
      'com.dearmydays.enterprise': 99000,
    }

    const amount =
      priceMap[verificationResult.productId || ''] || priceMap[productId] || 0

    // event_purchases 테이블에 기록
    const { error: purchaseError } = await admin
      .from('event_purchases')
      .insert({
        user_id: userId,
        provider: provider as PaymentProvider,
        transaction_id: transactionId,
        amount,
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

    // user_plans 테이블 업데이트
    const { error: planError } = await admin.from('user_plans').upsert({
      user_id: userId,
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
      transactionId,
      expiresAt: verificationResult.expiresAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
