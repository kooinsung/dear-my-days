export type NotificationUnit = 'days' | 'hours' | 'minutes'

export const NOTIFICATION_PRESETS = [
  { label: '1주 전', minutes: 10080 },
  { label: '3일 전', minutes: 4320 },
  { label: '1일 전', minutes: 1440 },
  { label: '12시간 전', minutes: 720 },
  { label: '3시간 전', minutes: 180 },
  { label: '1시간 전', minutes: 60 },
  { label: '30분 전', minutes: 30 },
] as const

export const UNIT_OPTIONS: { value: NotificationUnit; label: string }[] = [
  { value: 'days', label: '일 전' },
  { value: 'hours', label: '시간 전' },
  { value: 'minutes', label: '분 전' },
]

export function unitToMinutes(value: number, unit: NotificationUnit): number {
  switch (unit) {
    case 'days':
      return value * 1440
    case 'hours':
      return value * 60
    case 'minutes':
      return value
  }
}

export function minutesToUnit(minutes: number): {
  value: number
  unit: NotificationUnit
} {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: 'days' }
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' }
  }
  return { value: minutes, unit: 'minutes' }
}

export function formatMinutesBefore(minutes: number): string {
  const { value, unit } = minutesToUnit(minutes)
  const unitLabel = UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? '분 전'
  return `${value}${unitLabel}`
}
