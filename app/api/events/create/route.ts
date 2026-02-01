import { type NextRequest, NextResponse } from 'next/server'
import { lunarToSolar } from '@/libs/kasi/lunar-to-solar'
import { solarToLunar } from '@/libs/kasi/solar-to-lunar'
import type { CalendarType } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'

function parseYmd(date: string): { year: number; month: number; day: number } {
  const [y, m, d] = date.split('-').map((v) => Number(v))
  if (!y || !m || !d) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD')
  }
  return { year: y, month: m, day: d }
}

function fmtYmd(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, category, solar_date, lunar_date, calendar_type, note } =
      body as {
        title: string
        category: string
        solar_date?: string
        lunar_date?: string
        calendar_type: CalendarType
        note?: string | null
      }

    if (!title || !category || !calendar_type) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let finalSolar = solar_date ?? ''
    let finalLunar: string | null = lunar_date ?? null
    let finalIsLeapMonth = false

    if (calendar_type === 'LUNAR') {
      if (!lunar_date) {
        return NextResponse.json(
          { error: 'lunar_date is required when calendar_type is LUNAR' },
          { status: 400 },
        )
      }
      const { year, month, day } = parseYmd(lunar_date)
      const converted = await lunarToSolar(year, month, day, false)
      finalSolar = fmtYmd(converted)
      finalLunar = lunar_date
      finalIsLeapMonth = false
    } else {
      if (!solar_date) {
        return NextResponse.json(
          { error: 'solar_date is required when calendar_type is SOLAR' },
          { status: 400 },
        )
      }
      const { year, month, day } = parseYmd(solar_date)
      const converted = await solarToLunar(year, month, day)
      finalSolar = solar_date
      finalLunar = fmtYmd({
        year: converted.lunarYear,
        month: converted.lunarMonth,
        day: converted.lunarDay,
      })
      finalIsLeapMonth = converted.isLeapMonth
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        category,
        solar_date: finalSolar,
        lunar_date: finalLunar,
        calendar_type,
        is_leap_month: finalIsLeapMonth,
        note: note ?? null,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
