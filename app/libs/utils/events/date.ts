import type { Dayjs } from 'dayjs'
import { dayjs } from '@/libs/utils/date'

/**
 * 이벤트용 날짜 유틸 (도메인 의존)
 */

// 주어진 날짜(YYYY-MM-DD)의 월/일을 올해로 치환해 YYYY-MM-DD로 반환
export function toThisYearDate(
  date: string | Date,
  baseDate: string | Date | Dayjs = dayjs(),
): string {
  const base = dayjs(baseDate).startOf('day')
  const src = dayjs(date)
  const thisYear = base.year()

  return dayjs()
    .year(thisYear)
    .month(src.month())
    .date(src.date())
    .startOf('day')
    .format('YYYY-MM-DD')
}

// 이번 해 기준으로 날짜가 오늘 이후(오늘 포함)인지 여부
export function isUpcomingThisYear(
  date: string | Date,
  baseDate: string | Date | Dayjs = dayjs(),
): boolean {
  const base = dayjs(baseDate).startOf('day')
  const thisYearDate = dayjs(toThisYearDate(date, base)).startOf('day')
  return thisYearDate.isSame(base, 'day') || thisYearDate.isAfter(base, 'day')
}

// Event를 '올해 발생일' 기준으로 변환해 upcoming만 반환
export function getUpcomingEventsThisYear<T extends { solar_date: string }>(
  events: T[],
  baseDate: string | Date | Dayjs = dayjs(),
): T[] {
  const base = dayjs(baseDate).startOf('day')

  return events
    .map((event) => ({
      ...event,
      solar_date: toThisYearDate(event.solar_date, base),
    }))
    .filter((event) => isUpcomingThisYear(event.solar_date, base))
    .sort((a, b) => a.solar_date.localeCompare(b.solar_date))
}
