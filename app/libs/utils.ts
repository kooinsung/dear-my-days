import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ko'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('ko')

/**
 * 날짜 유틸리티
 * 글로벌하게 사용되는 날짜 처리 함수들
 */

// D-Day 계산
export function calculateDday(targetDate: string): number {
  const today = dayjs().startOf('day')
  const target = dayjs(targetDate).startOf('day')
  return target.diff(today, 'day')
}

// D-Day 포맷팅
export function formatDday(dday: number): string {
  if (dday === 0) {
    return 'D-Day'
  }
  if (dday > 0) {
    return `D-${dday}`
  }
  return `D+${Math.abs(dday)}`
}

// 날짜 포맷팅
export function formatDate(date: string | Date, format = 'YYYY.MM.DD'): string {
  return dayjs(date).format(format)
}

// 상대 시간 포맷팅
export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow()
}

// 날짜가 과거인지 확인
export function isPast(date: string | Date): boolean {
  return dayjs(date).isBefore(dayjs(), 'day')
}

// 날짜가 미래인지 확인
export function isFuture(date: string | Date): boolean {
  return dayjs(date).isAfter(dayjs(), 'day')
}

// 날짜가 오늘인지 확인
export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 이벤트용 날짜 유틸
 */

// 주어진 날짜(YYYY-MM-DD)의 월/일을 올해로 치환해 YYYY-MM-DD로 반환
export function toThisYearDate(
  date: string | Date,
  baseDate: string | Date | Dayjs = dayjs(),
): string {
  const base = dayjs(baseDate).startOf('day')
  const src = dayjs(date)
  const thisYear = base.year()

  // month(): 0-11, date(): 1-31
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

// Supabase Event를 '올해 발생일' 기준으로 변환해 upcoming만 반환
export function getUpcomingEventsThisYear<T extends { solar_date: string }>(
  events: T[],
  baseDate: string | Date | Dayjs = dayjs(),
): T[] {
  const base = dayjs(baseDate).startOf('day')

  return events
    .map((event) => ({
      ...event,
      // D-day 계산은 solar_date를 쓰고 있으므로 올해 날짜로 치환
      solar_date: toThisYearDate(event.solar_date, base),
    }))
    .filter((event) => isUpcomingThisYear(event.solar_date, base))
    .sort((a, b) => a.solar_date.localeCompare(b.solar_date))
}

// Dayjs 인스턴스 export (필요시 직접 사용)
export { dayjs }
