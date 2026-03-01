import { type NextRequest, NextResponse } from 'next/server'
import { ERROR_MESSAGES } from '@/libs/constants/messages'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { convertCalendarDates } from '@/libs/utils/calendar-conversion'
import { handleApiError, successResponse } from '@/libs/utils/errors'
import { createEventSchema } from '@/libs/validation/schemas'

const FREE_EVENT_LIMIT = 3

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Zod 검증
    const body = await req.json()
    const validated = createEventSchema.parse(body)

    // 이벤트 제한 사전 체크
    const admin = supabaseAdmin()

    const [{ count: eventCount }, { data: userPlan }] = await Promise.all([
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      admin
        .from('user_plans')
        .select('plan_type, extra_event_slots')
        .eq('user_id', user.id)
        .single(),
    ])

    const planType = userPlan?.plan_type ?? 'FREE'
    const isPremium =
      planType === 'PREMIUM_MONTHLY' || planType === 'PREMIUM_YEARLY'

    if (!isPremium) {
      const extraSlots = userPlan?.extra_event_slots ?? 0
      const maxEvents = FREE_EVENT_LIMIT + extraSlots

      if ((eventCount ?? 0) >= maxEvents) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.events.limitExceeded },
          { status: 403 },
        )
      }
    }

    // 달력 변환
    const { finalSolar, finalLunar, finalIsLeapMonth } =
      await convertCalendarDates(
        validated.calendar_type,
        validated.solar_date,
        validated.lunar_date,
        validated.is_leap_month,
      )

    // DB 삽입
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title: validated.title,
        category: validated.category,
        solar_date: finalSolar,
        lunar_date: finalLunar,
        calendar_type: validated.calendar_type,
        is_leap_month: finalIsLeapMonth,
        note: validated.note ?? null,
      })
      .select('*')
      .single()

    if (error) {
      return await handleApiError(error, {
        url: '/api/events/create',
        method: 'POST',
      })
    }

    return successResponse(data)
  } catch (error) {
    return await handleApiError(error)
  }
}
