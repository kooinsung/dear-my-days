import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 현재 사용자의 구독 상태 조회
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

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

    // 사용자의 구독 플랜 조회
    const { data: plan, error: planError } = await supabase
      .from('user_plans')
      .select('plan_type, started_at, expired_at, extra_event_slots')
      .eq('user_id', user.id)
      .single()

    if (planError) {
      // 구독 없음 (FREE 플랜)
      return successResponse({
        planType: 'FREE',
        expiresAt: null,
        extraEventSlots: 0,
        eventLimit: 3,
      })
    }

    // plan_type을 신뢰 (서버-투-서버 알림 없이는 expired_at으로 판단 불가)
    // 자동 갱신 시 expired_at이 갱신되지 않으므로, plan_type이 PREMIUM이면 활성으로 간주
    const planType = plan.plan_type ?? 'FREE'
    const extraSlots = plan.extra_event_slots || 0
    const isPremium =
      planType === 'PREMIUM_MONTHLY' || planType === 'PREMIUM_YEARLY'
    const eventLimit = isPremium ? 999999 : 3 + extraSlots

    Sentry.addBreadcrumb({
      category: 'iap',
      message: 'subscription check',
      level: 'info',
      data: { userId: user.id, planType, isPremium, extraSlots, eventLimit },
    })

    return successResponse({
      planType,
      startedAt: plan.started_at,
      expiresAt: plan.expired_at,
      isActive: isPremium,
      extraEventSlots: extraSlots,
      eventLimit,
    })
  } catch (error) {
    return await handleApiError(error)
  }
}
