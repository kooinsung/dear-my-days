import { callKasiApi } from './client'
import type { LunarSpecialResult, SpcifyLunCalInfoItem } from './types'

export async function findLunarDateRange(
  lunarMonth: number,
  lunarDay: number,
  fromYear: number,
  toYear: number,
): Promise<LunarSpecialResult[]> {
  const items = await callKasiApi<SpcifyLunCalInfoItem>('getSpcifyLunCalInfo', {
    fromSolYear: String(fromYear),
    toSolYear: String(toYear),
    lunMonth: String(lunarMonth).padStart(2, '0'),
    lunDay: String(lunarDay).padStart(2, '0'),
  })

  const normalized = Array.isArray(items) ? items : [items]

  return normalized.map((item) => ({
    year: Number.parseInt(item.solYear, 10),
    month: Number.parseInt(item.solMonth, 10),
    day: Number.parseInt(item.solDay, 10),
    lunarYear: Number.parseInt(item.lunYear, 10),
    lunarMonth: Number.parseInt(item.lunMonth, 10),
    lunarDay: Number.parseInt(item.lunDay, 10),
    isLeapMonth: item.lunLeapmonth === '윤',
  }))
}
