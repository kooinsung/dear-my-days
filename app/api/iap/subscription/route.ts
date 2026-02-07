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
      .select('plan_type, started_at, expired_at')
      .eq('user_id', user.id)
      .single()

    if (planError) {
      // 구독 없음
      return successResponse({
        planType: null,
        expiresAt: null,
      })
    }

    // 만료 확인
    const now = new Date()
    const expiresAt = plan.expired_at ? new Date(plan.expired_at) : null
    const isExpired = expiresAt && expiresAt < now

    return successResponse({
      planType: isExpired ? null : plan.plan_type,
      startedAt: plan.started_at,
      expiresAt: plan.expired_at,
      isActive: !isExpired,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
