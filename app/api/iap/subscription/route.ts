import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

const PREMIUM_MONTHLY_LIMIT = 10

function getMonthsElapsed(startedAt: string): number {
  const start = new Date(startedAt)
  const now = new Date()
  return Math.max(
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()) +
      1,
    1,
  )
}

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

    const planType = plan.plan_type ?? 'FREE'
    const extraSlots = plan.extra_event_slots || 0
    const isPremium =
      planType === 'PREMIUM_MONTHLY' || planType === 'PREMIUM_YEARLY'

    Sentry.addBreadcrumb({
      category: 'iap',
      message: 'subscription check',
      level: 'info',
      data: { userId: user.id, planType, isPremium, extraSlots },
    })

    if (isPremium && plan.started_at) {
      // 프리미엄: 구독 시작 이후 이벤트만 카운트
      const { count: premiumEventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', plan.started_at)

      const monthsElapsed = getMonthsElapsed(plan.started_at)
      const totalAllowance = monthsElapsed * PREMIUM_MONTHLY_LIMIT
      const used = premiumEventCount ?? 0

      return successResponse({
        planType,
        startedAt: plan.started_at,
        expiresAt: plan.expired_at,
        isActive: true,
        extraEventSlots: extraSlots,
        eventLimit: totalAllowance,
        eventCount: used,
        monthlyAllowance: PREMIUM_MONTHLY_LIMIT,
      })
    }

    // FREE 플랜
    const eventLimit = 3 + extraSlots

    return successResponse({
      planType,
      startedAt: plan.started_at,
      expiresAt: plan.expired_at,
      isActive: false,
      extraEventSlots: extraSlots,
      eventLimit,
    })
  } catch (error) {
    return await handleApiError(error)
  }
}
