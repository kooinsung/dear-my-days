import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/libs/supabase/server'
import { convertCalendarDates } from '@/libs/utils/calendar-conversion'
import { handleApiError, successResponse } from '@/libs/utils/errors'
import { updateEventSchema } from '@/libs/validation/schemas'

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
    const validated = updateEventSchema.parse(body)

    // calendar_type은 필수 (partial이지만 update 시에는 필요)
    if (!validated.calendar_type) {
      return NextResponse.json(
        { error: 'calendar_type is required' },
        { status: 400 },
      )
    }

    // 달력 변환
    const { finalSolar, finalLunar, finalIsLeapMonth } =
      await convertCalendarDates(
        validated.calendar_type,
        validated.solar_date,
        validated.lunar_date,
        validated.is_leap_month,
      )

    // DB 업데이트
    const { data, error } = await supabase
      .from('events')
      .update({
        title: validated.title,
        category: validated.category,
        solar_date: finalSolar,
        lunar_date: finalLunar,
        calendar_type: validated.calendar_type,
        is_leap_month: finalIsLeapMonth,
        note: validated.note ?? null,
      })
      .eq('id', validated.id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
