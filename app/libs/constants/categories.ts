import type { CategoryType } from '@/libs/supabase/database.types'

export type CategoryConfig = {
  value: CategoryType
  label: string
  icon: string
  color: string
}

export const CATEGORIES: CategoryConfig[] = [
  { value: 'BIRTHDAY', label: '생일', icon: '🎂', color: '#FF6B9D' },
  { value: 'ANNIVERSARY', label: '기념일', icon: '💝', color: '#C780FA' },
  { value: 'MEMORIAL', label: '기일', icon: '🕯️', color: '#A0AEC0' },
  { value: 'HOLIDAY', label: '공휴일', icon: '🎉', color: '#4FD1C5' },
  { value: 'OTHER', label: '기타', icon: '📅', color: '#90CDF4' },
] as const

export function getCategoryConfig(
  category: CategoryType,
): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.value === category)
}

export function getCategoryLabel(category: CategoryType): string {
  return getCategoryConfig(category)?.label || category
}

export function getCategoryIcon(category: CategoryType): string {
  return getCategoryConfig(category)?.icon || '📅'
}

export function getCategoryColor(category: CategoryType): string {
  return getCategoryConfig(category)?.color || '#90CDF4'
}
