import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('ko')

// Dayjs 인스턴스 export (필요시 직접 사용)
export { dayjs }

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
