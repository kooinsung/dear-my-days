import 'server-only'

import { sendSlackNotification } from '@/libs/slack/client'
import { formatIAPRefundMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'

interface ProcessRefundParams {
  transactionId: string
  provider: 'APPLE' | 'GOOGLE'
  reason?: string
}

interface ProcessRefundResult {
  processed: boolean
  alreadyRefunded?: boolean
  error?: string
}

export async function processRefund({
  transactionId,
  provider,
  reason,
}: ProcessRefundParams): Promise<ProcessRefundResult> {
  const admin = supabaseAdmin()

  // 1. transaction_id로 event_purchases 조회
  const { data: purchase, error: fetchError } = await admin
    .from('event_purchases')
    .select('id, user_id, purchase_type, product_id, amount, status')
    .eq('transaction_id', transactionId)
    .single()

  if (fetchError || !purchase) {
    return { processed: false, error: 'Purchase not found' }
  }

  // 2. 이미 REFUNDED면 무시 (멱등성)
  if (purchase.status === 'REFUNDED') {
    return { processed: false, alreadyRefunded: true }
  }

  // 3. status → REFUNDED, refunded_at 업데이트
  const { error: updateError } = await admin
    .from('event_purchases')
    .update({
      status: 'REFUNDED',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchase.id)

  if (updateError) {
    return { processed: false, error: 'Failed to update purchase status' }
  }

  // 4. purchase_type별 되돌리기
  if (purchase.purchase_type === 'EVENT_SLOT') {
    await admin.rpc('decrement_event_slots', {
      user_id_param: purchase.user_id,
      decrement_by: 1,
    })
  } else if (purchase.purchase_type === 'SUBSCRIPTION') {
    // 다른 활성 구독이 없으면 FREE로 변경
    const { data: activeSubscriptions } = await admin
      .from('event_purchases')
      .select('id')
      .eq('user_id', purchase.user_id)
      .eq('purchase_type', 'SUBSCRIPTION')
      .eq('status', 'COMPLETED')
      .neq('id', purchase.id)
      .limit(1)

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      await admin
        .from('user_plans')
        .update({ plan_type: 'FREE' })
        .eq('user_id', purchase.user_id)
    }
  }

  // 5. Slack 환불 알림
  await sendSlackNotification(
    formatIAPRefundMessage({
      provider,
      productId: purchase.product_id ?? 'unknown',
      amount: purchase.amount ?? 0,
      userId: purchase.user_id,
      transactionId,
      reason,
    }),
  )

  return { processed: true }
}
