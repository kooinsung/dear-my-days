import { callKasiApi, formatYmdParams } from './client'
import type { LunCalInfoItem, SolarToLunarResult } from './types'

export async function solarToLunar(
  year: number,
  month: number,
  day: number,
): Promise<SolarToLunarResult> {
  const {
    year: solYear,
    month: solMonth,
    day: solDay,
  } = formatYmdParams({
    year,
    month,
    day,
  })

  const item = (await callKasiApi<LunCalInfoItem>('getLunCalInfo', {
    solYear,
    solMonth,
    solDay,
  })) as LunCalInfoItem

  return {
    lunarYear: Number.parseInt(item.lunYear, 10),
    lunarMonth: Number.parseInt(item.lunMonth, 10),
    lunarDay: Number.parseInt(item.lunDay, 10),
    isLeapMonth: item.lunLeapmonth === '윤',
  }
}
