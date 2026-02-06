import { lunarToSolarCandidates } from '@/libs/kasi/lunar-to-solar'
import { solarToLunar } from '@/libs/kasi/solar-to-lunar'
import type { CalendarType } from '@/libs/supabase/database.types'

// parseYmd와 fmtYmd를 create/update 라우트에서 이동
export function parseYmd(date: string): {
  year: number
  month: number
  day: number
} {
  const [y, m, d] = date.split('-').map((v) => Number(v))
  if (!y || !m || !d) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD')
  }
  return { year: y, month: m, day: d }
}

export function fmtYmd(parts: {
  year: number
  month: number
  day: number
}): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export type ConversionResult = {
  finalSolar: string
  finalLunar: string | null
  finalIsLeapMonth: boolean
}

// create/update 라우트의 59-111줄 중복 로직 추출
export async function convertCalendarDates(
  calendarType: CalendarType,
  solarDate?: string,
  lunarDate?: string,
  isLeapMonth?: boolean,
): Promise<ConversionResult> {
  if (calendarType === 'LUNAR') {
    if (!lunarDate) {
      throw new Error('lunar_date is required when calendar_type is LUNAR')
    }

    const { year, month, day } = parseYmd(lunarDate)
    const { candidates } = await lunarToSolarCandidates(year, month, day)

    if (!candidates.length) {
      throw new Error('No conversion candidates returned from KASI')
    }

    // 사용자 선택값 우선, 없으면 윤달 우선, 그 외 첫 후보
    const preferred =
      typeof isLeapMonth === 'boolean'
        ? candidates.find((c) => c.isLeapMonth === isLeapMonth)
        : candidates.find((c) => c.isLeapMonth)

    const picked = preferred ?? candidates[0]

    return {
      finalSolar: fmtYmd({
        year: picked.solarYear,
        month: picked.solarMonth,
        day: picked.solarDay,
      }),
      finalLunar: lunarDate,
      finalIsLeapMonth: picked.isLeapMonth,
    }
  }

  // SOLAR 변환
  if (!solarDate) {
    throw new Error('solar_date is required when calendar_type is SOLAR')
  }

  const { year, month, day } = parseYmd(solarDate)
  const converted = await solarToLunar(year, month, day)

  return {
    finalSolar: solarDate,
    finalLunar: fmtYmd({
      year: converted.lunarYear,
      month: converted.lunarMonth,
      day: converted.lunarDay,
    }),
    finalIsLeapMonth: converted.isLeapMonth,
  }
}
