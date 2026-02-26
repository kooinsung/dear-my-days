export interface NotificationEntry {
  days: number
  hours: number
  minutes: number
}

export function entryToMinutesBefore(entry: NotificationEntry): number {
  return entry.days * 1440 + entry.hours * 60 + entry.minutes
}

export function minutesBeforeToEntry(total: number): NotificationEntry {
  const days = Math.floor(total / 1440)
  const hours = Math.floor((total % 1440) / 60)
  const minutes = total % 60
  return { days, hours, minutes }
}

export function formatMinutesBefore(total: number): string {
  const { days, hours, minutes } = minutesBeforeToEntry(total)
  const parts: string[] = []
  if (days > 0) {
    parts.push(`${days}일`)
  }
  if (hours > 0) {
    parts.push(`${hours}시간`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}분`)
  }
  if (parts.length === 0) {
    return '당일'
  }
  return `${parts.join(' ')} 전`
}
