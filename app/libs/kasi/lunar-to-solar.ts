import { callKasiApi, formatYmdParams } from './client'
import type { LunarToSolarResult, SolCalInfoItem } from './types'

export async function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false,
): Promise<LunarToSolarResult> {
  const {
    year: lunYear,
    month: lunMonth,
    day: lunDay,
  } = formatYmdParams({
    year,
    month,
    day,
  })

  const item = (await callKasiApi<SolCalInfoItem>('getSolCalInfo', {
    lunYear,
    lunMonth,
    lunDay,
    ...(isLeapMonth ? { leapMonth: '윤' } : {}),
  })) as SolCalInfoItem

  return {
    year: Number.parseInt(item.solYear, 10),
    month: Number.parseInt(item.solMonth, 10),
    day: Number.parseInt(item.solDay, 10),
  }
}
